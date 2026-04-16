// backend/src/services/videoRetryService.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { exec, execSync, ExecOptions } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { DB_QUERY_STATUS_MAP } from '../utils/statusHelpers';

const prisma = new PrismaClient();

interface RetryInfo {
    retryCount: number;
    lastRetryAt: Date;
    firstRetryAt: Date;
}

type VideoRetryTracker = Record<string, RetryInfo>;

const TRACKER_FILE_PATH = path.join(__dirname, '..', '..', 'video-retry-tracker.json');

let retryTracker: VideoRetryTracker = {};
let isProcessingRetries = false;
let trackerLoaded = false;
let serviceStarted = false;
let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

const parseBooleanEnv = (raw: string | undefined, fallback: boolean): boolean => {
    if (raw === undefined) {
        return fallback;
    }

    const normalized = raw.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false;
    }

    return fallback;
};

const parseIntEnv = (
    raw: string | undefined,
    fallback: number,
    min: number,
    fieldName: string
): number => {
    if (raw === undefined || raw.trim() === '') {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < min) {
        console.warn(`[video-retry] Valor invalido en ${fieldName}="${raw}". Usando ${fallback}.`);
        return fallback;
    }

    return parsed;
};

const normalizeBaseUrl = (url: string): string => url.replace(/\/$/, '');

const RETRY_CONFIG = {
    enabled: parseBooleanEnv(process.env.VIDEO_RETRY_SERVICE_ENABLED, true),
    runOnStart: parseBooleanEnv(process.env.VIDEO_RETRY_RUN_ON_START, true),
    cronSchedule: (process.env.VIDEO_RETRY_CRON || '0 * * * *').trim(),
    maxAttempts: parseIntEnv(process.env.VIDEO_RETRY_MAX_ATTEMPTS, 10, 1, 'VIDEO_RETRY_MAX_ATTEMPTS'),
    maxAlarmAgeDays: parseIntEnv(process.env.VIDEO_RETRY_MAX_AGE_DAYS, 2, 1, 'VIDEO_RETRY_MAX_AGE_DAYS'),
    trackingRetentionDays: parseIntEnv(process.env.VIDEO_RETRY_TRACK_RETENTION_DAYS, 3, 1, 'VIDEO_RETRY_TRACK_RETENTION_DAYS'),
    delayMsBetweenRetries: parseIntEnv(process.env.VIDEO_RETRY_DELAY_MS, 60000, 0, 'VIDEO_RETRY_DELAY_MS'),
    maxPerRun: parseIntEnv(process.env.VIDEO_RETRY_MAX_PER_RUN, 20, 1, 'VIDEO_RETRY_MAX_PER_RUN'),
    requireDeviceOnline: parseBooleanEnv(process.env.VIDEO_RETRY_REQUIRE_DEVICE_ONLINE, true),
    retryIfOnlineUnknown: parseBooleanEnv(process.env.VIDEO_RETRY_IF_ONLINE_UNKNOWN, true),
    onlineStatusBatchSize: parseIntEnv(process.env.VIDEO_RETRY_ONLINE_BATCH_SIZE, 100, 1, 'VIDEO_RETRY_ONLINE_BATCH_SIZE'),
    onlineStatusTimeoutMs: parseIntEnv(process.env.VIDEO_RETRY_ONLINE_TIMEOUT_MS, 15000, 1000, 'VIDEO_RETRY_ONLINE_TIMEOUT_MS'),
    cameraApiBaseUrl: normalizeBaseUrl(process.env.CAMERA_API_BASE_URL || 'http://190.183.254.253:8088'),
};

const RETRYABLE_STATUSES = [
    ...DB_QUERY_STATUS_MAP.suspicious,
    ...DB_QUERY_STATUS_MAP.confirmed,
];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const chunkArray = <T>(items: T[], size: number): T[][] => {
    if (items.length === 0) {
        return [];
    }

    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};

const loadRetryTracker = (): void => {
    try {
        if (!fs.existsSync(TRACKER_FILE_PATH)) {
            retryTracker = {};
            trackerLoaded = true;
            console.log('[video-retry] Tracker inexistente. Se inicia vacio.');
            return;
        }

        const content = fs.readFileSync(TRACKER_FILE_PATH, 'utf-8').trim();
        if (!content) {
            retryTracker = {};
            trackerLoaded = true;
            console.log('[video-retry] Tracker vacio. Se inicia sin registros.');
            return;
        }

        const parsed = JSON.parse(content) as Record<string, { retryCount: number; lastRetryAt: string; firstRetryAt: string }>;
        const nextTracker: VideoRetryTracker = {};

        for (const [guid, info] of Object.entries(parsed)) {
            if (!info || typeof info.retryCount !== 'number') {
                continue;
            }

            const lastRetryAt = new Date(info.lastRetryAt);
            const firstRetryAt = new Date(info.firstRetryAt);

            if (Number.isNaN(lastRetryAt.getTime()) || Number.isNaN(firstRetryAt.getTime())) {
                continue;
            }

            nextTracker[guid] = {
                retryCount: info.retryCount,
                lastRetryAt,
                firstRetryAt,
            };
        }

        retryTracker = nextTracker;
        trackerLoaded = true;
        console.log(`[video-retry] Tracker cargado: ${Object.keys(retryTracker).length} alarma(s).`);
    } catch (error) {
        console.error('[video-retry] Error cargando tracker. Se reinicia en memoria.', error);
        retryTracker = {};
        trackerLoaded = true;
    }
};

const ensureTrackerLoaded = (): void => {
    if (!trackerLoaded) {
        loadRetryTracker();
    }
};

const saveRetryTracker = (): void => {
    try {
        const serializable = Object.fromEntries(
            Object.entries(retryTracker).map(([guid, info]) => [
                guid,
                {
                    retryCount: info.retryCount,
                    lastRetryAt: info.lastRetryAt.toISOString(),
                    firstRetryAt: info.firstRetryAt.toISOString(),
                },
            ])
        );

        fs.writeFileSync(TRACKER_FILE_PATH, JSON.stringify(serializable, null, 2), 'utf-8');
    } catch (error) {
        console.error('[video-retry] Error guardando tracker.', error);
    }
};

const getRetryCount = (alarmGuid: string): number => retryTracker[alarmGuid]?.retryCount || 0;

const incrementRetryCount = (alarmGuid: string): number => {
    const now = new Date();
    const current = retryTracker[alarmGuid];

    if (!current) {
        retryTracker[alarmGuid] = {
            retryCount: 1,
            lastRetryAt: now,
            firstRetryAt: now,
        };
    } else {
        current.retryCount += 1;
        current.lastRetryAt = now;
    }

    saveRetryTracker();
    return retryTracker[alarmGuid].retryCount;
};

const clearRetryTracking = (alarmGuid: string, persist: boolean): void => {
    if (retryTracker[alarmGuid]) {
        delete retryTracker[alarmGuid];
        if (persist) {
            saveRetryTracker();
        }
    }
};

const cleanupOldTracking = (): void => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - RETRY_CONFIG.trackingRetentionDays);

    let removed = 0;
    for (const [guid, info] of Object.entries(retryTracker)) {
        if (info.lastRetryAt < threshold) {
            delete retryTracker[guid];
            removed += 1;
        }
    }

    if (removed > 0) {
        saveRetryTracker();
        console.log(`[video-retry] Limpieza: ${removed} alarma(s) removidas por antiguedad.`);
    }
};

const removeTrackedAlarmsNotInActiveList = (activeGuids: Set<string>): void => {
    let removed = 0;
    for (const guid of Object.keys(retryTracker)) {
        if (!activeGuids.has(guid)) {
            delete retryTracker[guid];
            removed += 1;
        }
    }

    if (removed > 0) {
        saveRetryTracker();
        console.log(`[video-retry] Limpieza: ${removed} alarma(s) removidas por resolucion/cambio de estado.`);
    }
};

const getPythonCommand = (): string => {
    const isWindows = process.platform === 'win32';

    if (isWindows) {
        const possiblePaths = [
            path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe'),
            path.join(__dirname, '..', '..', '..', '.venv', 'Scripts', 'python.exe'),
            path.join(process.cwd(), 'backend', '.venv', 'Scripts', 'python.exe'),
            path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
            'python.exe',
            'python',
            'py',
        ];

        for (const pythonPath of possiblePaths) {
            try {
                if (path.isAbsolute(pythonPath) && !fs.existsSync(pythonPath)) {
                    continue;
                }
                execSync(`"${pythonPath}" --version`, { encoding: 'utf8', stdio: 'pipe' });
                return pythonPath;
            } catch {
                continue;
            }
        }

        console.warn('[video-retry] Python no encontrado en .venv. Se usara python del sistema.');
        return 'python';
    }

    const possiblePaths = [
        path.join(__dirname, '..', '..', '.venv', 'bin', 'python3'),
        path.join(__dirname, '..', '..', '..', '.venv', 'bin', 'python3'),
        path.join(process.cwd(), 'backend', '.venv', 'bin', 'python3'),
        path.join(process.cwd(), '.venv', 'bin', 'python3'),
        'python3',
        'python',
    ];

    for (const pythonPath of possiblePaths) {
        try {
            if (path.isAbsolute(pythonPath) && !fs.existsSync(pythonPath)) {
                continue;
            }
            execSync(`${pythonPath} --version`, { encoding: 'utf8', stdio: 'pipe' });
            return pythonPath;
        } catch {
            continue;
        }
    }

    return 'python3';
};

const resolveVideoScriptPath = (): string | null => {
    const scriptName = '_2video.py';
    const candidatePaths = [
        path.join(process.cwd(), 'backend', 'camaras', scriptName),
        path.join(process.cwd(), 'camaras', scriptName),
        path.join(__dirname, '..', '..', 'camaras', scriptName),
        path.join(__dirname, '..', '..', '..', 'camaras', scriptName),
    ];

    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
};

const triggerVideoScript = (alarm: { dispositivo: number | null; alarmTime: Date | null; guid: string }): boolean => {
    if (!alarm.dispositivo || !alarm.alarmTime || !alarm.guid) {
        console.error(`[video-retry] Datos insuficientes para alarma ${alarm.guid}.`);
        return false;
    }

    try {
        const scriptPath = resolveVideoScriptPath();
        if (!scriptPath) {
            console.error('[video-retry] No se encontro _2video.py.');
            return false;
        }

        const pythonExecutable = getPythonCommand();
        const alarmTimeISO = alarm.alarmTime.toISOString();
        const dispositivoStr = alarm.dispositivo.toString();

        if (!fs.existsSync(scriptPath)) {
            console.error(`[video-retry] Script inexistente en ${scriptPath}.`);
            return false;
        }

        const command = process.platform === 'win32'
            ? `"${pythonExecutable}" "${scriptPath}" ${dispositivoStr} "${alarmTimeISO}" ${alarm.guid}`
            : `${pythonExecutable} "${scriptPath}" "${dispositivoStr}" "${alarmTimeISO}" "${alarm.guid}"`;

        const execOptions: ExecOptions = {
            cwd: path.dirname(scriptPath),
            env: process.env,
            shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
            windowsHide: true,
        };

        exec(command, execOptions, (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
            const stdoutStr = stdout.toString();
            const stderrStr = stderr.toString();

            if (error) {
                console.error(`[video-retry] Error ejecutando _2video.py para ${alarm.guid}:`, error.message);
            }
            if (stderrStr) {
                console.error(`[video-retry] stderr ${alarm.guid}:`, stderrStr);
            }
            if (stdoutStr) {
                console.log(`[video-retry] stdout ${alarm.guid}:`, stdoutStr);
            }
        });

        return true;
    } catch (error) {
        console.error('[video-retry] Error configurando ejecucion de _2video.py:', error);
        return false;
    }
};

const getCameraSession = async (): Promise<string | null> => {
    const apiUser = process.env.API_USER;
    const apiPassword = process.env.API_PASSWORD;

    if (!apiUser || !apiPassword) {
        console.warn('[video-retry] API_USER/API_PASSWORD no configurados. Se omite filtro online/offline.');
        return null;
    }

    try {
        const response = await axios.get(`${RETRY_CONFIG.cameraApiBaseUrl}/StandardApiAction_login.action`, {
            params: {
                account: apiUser,
                password: apiPassword,
            },
            timeout: RETRY_CONFIG.onlineStatusTimeoutMs,
        });

        const jsession = response.data?.jsession;
        if (response.data?.result === 0 && typeof jsession === 'string' && jsession.trim() !== '') {
            return jsession;
        }

        console.warn('[video-retry] Login en API de camaras sin jsession valido. Se omite filtro online/offline.');
        return null;
    } catch (error) {
        console.warn('[video-retry] Error al autenticar contra API de camaras. Se omite filtro online/offline.', error);
        return null;
    }
};

const closeCameraSession = async (jsession: string): Promise<void> => {
    try {
        await axios.get(`${RETRY_CONFIG.cameraApiBaseUrl}/StandardApiAction_logout.action`, {
            params: { jsession },
            timeout: RETRY_CONFIG.onlineStatusTimeoutMs,
        });
    } catch {
        // No bloquea el flujo de reintentos
    }
};

const getDeviceOnlineStatusMap = async (deviceIds: number[]): Promise<Map<number, boolean> | null> => {
    if (deviceIds.length === 0) {
        return new Map<number, boolean>();
    }

    const jsession = await getCameraSession();
    if (!jsession) {
        return null;
    }

    const statusMap = new Map<number, boolean>();

    try {
        const batches = chunkArray(deviceIds, RETRY_CONFIG.onlineStatusBatchSize);

        for (const batch of batches) {
            const response = await axios.get(`${RETRY_CONFIG.cameraApiBaseUrl}/StandardApiAction_getDeviceOlStatus.action`, {
                params: {
                    jsession,
                    devIdno: batch.join(','),
                },
                timeout: RETRY_CONFIG.onlineStatusTimeoutMs,
            });

            const onlines = Array.isArray(response.data?.onlines) ? response.data.onlines : [];
            for (const entry of onlines) {
                const didRaw = entry?.did;
                const onlineRaw = entry?.online;
                const did = Number.parseInt(String(didRaw), 10);
                if (!Number.isFinite(did)) {
                    continue;
                }

                statusMap.set(did, Number(onlineRaw) === 1);
            }
        }

        return statusMap;
    } catch (error) {
        console.warn('[video-retry] Error consultando estado online de dispositivos. Se omite filtro online/offline.', error);
        return null;
    } finally {
        await closeCameraSession(jsession);
    }
};

const retryFailedVideoDownloads = async (): Promise<void> => {
    ensureTrackerLoaded();

    if (isProcessingRetries) {
        console.log('[video-retry] Ejecucion omitida: ya hay otra corrida en proceso.');
        return;
    }

    isProcessingRetries = true;

    try {
        console.log('[video-retry] Buscando alarmas sospechosas/confirmadas sin video...');

        cleanupOldTracking();

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETRY_CONFIG.maxAlarmAgeDays);

        const alarmsWithoutVideo = await prisma.alarmasHistorico.findMany({
            where: {
                estado: { in: RETRYABLE_STATUSES },
                OR: [{ video: null }, { video: '' }],
                alarmTime: { gte: cutoffDate },
            },
            select: {
                guid: true,
                dispositivo: true,
                alarmTime: true,
                interno: true,
            },
            orderBy: { alarmTime: 'desc' },
        });

        if (alarmsWithoutVideo.length === 0) {
            removeTrackedAlarmsNotInActiveList(new Set());
            console.log('[video-retry] No hay alarmas para reintentar.');
            return;
        }

        removeTrackedAlarmsNotInActiveList(new Set(alarmsWithoutVideo.map((alarm) => alarm.guid)));

        let invalidCount = 0;
        let exhaustedCount = 0;
        const alarmsEligible: Array<{
            guid: string;
            dispositivo: number;
            alarmTime: Date;
            interno: string | null;
            retryCount: number;
        }> = [];

        for (const alarm of alarmsWithoutVideo) {
            if (!alarm.dispositivo || !alarm.alarmTime) {
                invalidCount += 1;
                continue;
            }

            const retries = getRetryCount(alarm.guid);
            if (retries >= RETRY_CONFIG.maxAttempts) {
                exhaustedCount += 1;
                continue;
            }

            alarmsEligible.push({
                guid: alarm.guid,
                dispositivo: alarm.dispositivo,
                alarmTime: alarm.alarmTime,
                interno: alarm.interno ?? null,
                retryCount: retries,
            });
        }

        if (alarmsEligible.length === 0) {
            console.log(
                `[video-retry] Sin alarmas elegibles. agotadas=${exhaustedCount}, invalidas=${invalidCount}, total=${alarmsWithoutVideo.length}.`
            );
            return;
        }

        let offlineSkipped = 0;
        let unknownOnlineStatus = 0;
        let filteredEligible = alarmsEligible;

        if (RETRY_CONFIG.requireDeviceOnline) {
            const uniqueDevices = Array.from(new Set(alarmsEligible.map((alarm) => alarm.dispositivo)));
            const onlineStatusMap = await getDeviceOnlineStatusMap(uniqueDevices);

            if (onlineStatusMap) {
                filteredEligible = [];
                for (const alarm of alarmsEligible) {
                    const isOnline = onlineStatusMap.get(alarm.dispositivo);

                    if (isOnline === true) {
                        filteredEligible.push(alarm);
                        continue;
                    }

                    if (isOnline === false) {
                        offlineSkipped += 1;
                        continue;
                    }

                    unknownOnlineStatus += 1;
                    if (RETRY_CONFIG.retryIfOnlineUnknown) {
                        filteredEligible.push(alarm);
                    }
                }
            }
        }

        if (filteredEligible.length === 0) {
            console.log(
                `[video-retry] Sin alarmas para lanzar luego de filtro online. offline=${offlineSkipped}, estado_desconocido=${unknownOnlineStatus}.`
            );
            return;
        }

        const alarmsByRetryCount: Array<typeof filteredEligible> = Array.from(
            { length: RETRY_CONFIG.maxAttempts },
            () => []
        );

        for (const alarm of filteredEligible) {
            alarmsByRetryCount[alarm.retryCount].push(alarm);
        }

        const alarmsToRetry: typeof filteredEligible = [];
        const batchByRetryCount = new Array(RETRY_CONFIG.maxAttempts).fill(0);

        for (let retryCount = 0; retryCount < alarmsByRetryCount.length; retryCount += 1) {
            if (alarmsToRetry.length >= RETRY_CONFIG.maxPerRun) {
                break;
            }

            const bucket = alarmsByRetryCount[retryCount];
            if (bucket.length === 0) {
                continue;
            }

            const remainingSlots = RETRY_CONFIG.maxPerRun - alarmsToRetry.length;
            const takeCount = Math.min(bucket.length, remainingSlots);

            for (let index = 0; index < takeCount; index += 1) {
                alarmsToRetry.push(bucket[index]);
                batchByRetryCount[retryCount] += 1;
            }
        }

        const deferredByBatch = filteredEligible.length - alarmsToRetry.length;
        const firstAttemptInBatch = batchByRetryCount[0];

        console.log(
            `[video-retry] Reintentos a lanzar=${alarmsToRetry.length}, primer_intento=${firstAttemptInBatch}, reintentos=${alarmsToRetry.length - firstAttemptInBatch}, diferidas_por_lote=${deferredByBatch}, agotadas=${exhaustedCount}, invalidas=${invalidCount}, offline=${offlineSkipped}, estado_desconocido=${unknownOnlineStatus}.`
        );

        for (let index = 0; index < alarmsToRetry.length; index += 1) {
            const alarm = alarmsToRetry[index];
            const launched = triggerVideoScript({
                guid: alarm.guid,
                dispositivo: alarm.dispositivo,
                alarmTime: alarm.alarmTime,
            });

            if (launched) {
                const newRetryCount = incrementRetryCount(alarm.guid);
                console.log(
                    `[video-retry] Lanzado ${alarm.guid} (interno=${alarm.interno ?? 'N/A'}) intento ${newRetryCount}/${RETRY_CONFIG.maxAttempts}.`
                );
            } else {
                console.warn(`[video-retry] No se pudo lanzar script para ${alarm.guid}.`);
            }

            const isLast = index === alarmsToRetry.length - 1;
            if (!isLast && RETRY_CONFIG.delayMsBetweenRetries > 0) {
                await sleep(RETRY_CONFIG.delayMsBetweenRetries);
            }
        }
    } catch (error) {
        console.error('[video-retry] Error en corrida de reintentos:', error);
    } finally {
        isProcessingRetries = false;
    }
};

export const startVideoRetryService = (): void => {
    if (serviceStarted) {
        console.log('[video-retry] Servicio ya inicializado.');
        return;
    }
    serviceStarted = true;

    ensureTrackerLoaded();

    if (!RETRY_CONFIG.enabled) {
        console.log('[video-retry] Servicio deshabilitado por VIDEO_RETRY_SERVICE_ENABLED=false.');
        return;
    }

    if (!cron.validate(RETRY_CONFIG.cronSchedule)) {
        console.error(
            `[video-retry] CRON invalido "${RETRY_CONFIG.cronSchedule}". Servicio no iniciado.`
        );
        return;
    }

    console.log(
        `[video-retry] Iniciando servicio. cron=${RETRY_CONFIG.cronSchedule}, maxAttempts=${RETRY_CONFIG.maxAttempts}, maxPerRun=${RETRY_CONFIG.maxPerRun}, delayMs=${RETRY_CONFIG.delayMsBetweenRetries}.`
    );

    if (RETRY_CONFIG.runOnStart) {
        void retryFailedVideoDownloads();
    }

    scheduledTask = cron.schedule(RETRY_CONFIG.cronSchedule, async () => {
        await retryFailedVideoDownloads();
    });
};

export const manualRetryCheck = async (): Promise<void> => {
    ensureTrackerLoaded();
    await retryFailedVideoDownloads();
};

export const getRetryStats = () => {
    ensureTrackerLoaded();

    const byRetryCount: Record<number, number> = {};
    for (const info of Object.values(retryTracker)) {
        byRetryCount[info.retryCount] = (byRetryCount[info.retryCount] || 0) + 1;
    }

    return {
        config: RETRY_CONFIG,
        schedulerRunning: Boolean(scheduledTask),
        totalTracked: Object.keys(retryTracker).length,
        isProcessing: isProcessingRetries,
        byRetryCount,
        alarms: Object.entries(retryTracker).map(([guid, info]) => ({
            guid,
            retryCount: info.retryCount,
            lastRetryAt: info.lastRetryAt,
            firstRetryAt: info.firstRetryAt,
        })),
    };
};

export const resetAlarmRetryCount = (alarmGuid: string): boolean => {
    ensureTrackerLoaded();

    if (!retryTracker[alarmGuid]) {
        return false;
    }

    clearRetryTracking(alarmGuid, true);
    console.log(`[video-retry] Contador reiniciado para ${alarmGuid}.`);
    return true;
};
