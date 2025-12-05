// backend/src/services/videoRetryService.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { exec, ExecOptions } from 'child_process';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// ========================================
// SISTEMA DE TRACKING EN MEMORIA
// ========================================

interface VideoRetryTracker {
    [alarmGuid: string]: {
        retryCount: number;
        lastRetryAt: Date;
        firstRetryAt: Date;
    };
}

// Variable en memoria para rastrear los reintentos
let retryTracker: VideoRetryTracker = {};

// Ruta del archivo JSON para persistencia
const TRACKER_FILE_PATH = path.join(__dirname, '..', '..', 'video-retry-tracker.json');

/**
 * Carga el tracker desde el archivo JSON
 */
const loadRetryTracker = (): void => {
    try {
        if (fs.existsSync(TRACKER_FILE_PATH)) {
            const data = fs.readFileSync(TRACKER_FILE_PATH, 'utf-8');
            const parsed = JSON.parse(data);
            // Convertir las fechas de string a Date
            retryTracker = {};
            for (const [guid, info] of Object.entries(parsed)) {
                retryTracker[guid] = {
                    retryCount: (info as any).retryCount,
                    lastRetryAt: new Date((info as any).lastRetryAt),
                    firstRetryAt: new Date((info as any).firstRetryAt)
                };
            }
            console.log(`[✓] Tracker de reintentos cargado: ${Object.keys(retryTracker).length} alarmas en seguimiento`);
        } else {
            console.log('[ℹ] No existe archivo de tracking previo, iniciando nuevo tracker');
        }
    } catch (error) {
        console.error('[✗] Error al cargar el tracker de reintentos:', error);
        retryTracker = {};
    }
};

/**
 * Guarda el tracker en el archivo JSON
 */
const saveRetryTracker = (): void => {
    try {
        fs.writeFileSync(TRACKER_FILE_PATH, JSON.stringify(retryTracker, null, 2), 'utf-8');
    } catch (error) {
        console.error('[✗] Error al guardar el tracker de reintentos:', error);
    }
};

/**
 * Obtiene el contador de reintentos para una alarma
 */
const getRetryCount = (alarmGuid: string): number => {
    return retryTracker[alarmGuid]?.retryCount || 0;
};

/**
 * Incrementa el contador de reintentos para una alarma
 */
const incrementRetryCount = (alarmGuid: string): number => {
    if (!retryTracker[alarmGuid]) {
        retryTracker[alarmGuid] = {
            retryCount: 1,
            lastRetryAt: new Date(),
            firstRetryAt: new Date()
        };
    } else {
        retryTracker[alarmGuid].retryCount++;
        retryTracker[alarmGuid].lastRetryAt = new Date();
    }
    
    // Guardar cambios en archivo
    saveRetryTracker();
    
    return retryTracker[alarmGuid].retryCount;
};

/**
 * Limpia una alarma del tracker (cuando se descargó exitosamente)
 */
const clearRetryTracking = (alarmGuid: string): void => {
    if (retryTracker[alarmGuid]) {
        delete retryTracker[alarmGuid];
        saveRetryTracker();
    }
};

/**
 * Limpia alarmas antiguas del tracker (más de 3 días sin actualizar)
 */
const cleanupOldTracking = (): void => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    let cleaned = 0;
    for (const [guid, info] of Object.entries(retryTracker)) {
        if (info.lastRetryAt < threeDaysAgo) {
            delete retryTracker[guid];
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`[🧹] Limpiadas ${cleaned} alarmas antiguas del tracker`);
        saveRetryTracker();
    }
};

/**
 * Obtiene el comando correcto de Python según el sistema operativo
 */
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
            'py'
        ];
        
        for (const pythonPath of possiblePaths) {
            try {
                if (path.isAbsolute(pythonPath) && !fs.existsSync(pythonPath)) {
                    continue;
                }
                execSync(`"${pythonPath}" --version`, { 
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                console.log(`[✓] Python encontrado en: ${pythonPath}`);
                return pythonPath;
            } catch (e) {
                continue;
            }
        }
        
        console.warn('[⚠] No se encontró Python en el entorno virtual, usando Python del sistema');
        return 'python';
        
    } else {
        const possiblePaths = [
            path.join(__dirname, '..', '..', '.venv', 'bin', 'python3'),
            path.join(__dirname, '..', '..', '..', '.venv', 'bin', 'python3'),
            path.join(process.cwd(), 'backend', '.venv', 'bin', 'python3'),
            path.join(process.cwd(), '.venv', 'bin', 'python3'),
            'python3',
            'python'
        ];
        
        for (const pythonPath of possiblePaths) {
            try {
                if (path.isAbsolute(pythonPath) && !fs.existsSync(pythonPath)) {
                    continue;
                }
                execSync(`${pythonPath} --version`, { 
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                console.log(`[✓] Python encontrado en: ${pythonPath}`);
                return pythonPath;
            } catch (e) {
                continue;
            }
        }
        
        return 'python3';
    }
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

const triggerVideoScript = (alarm: { dispositivo: number | null, alarmTime: Date | null, guid: string }) => {
    if (!alarm.dispositivo || !alarm.alarmTime || !alarm.guid) {
        console.error(`[!] Datos insuficientes para descargar video de la alarma ${alarm.guid}.`);
        return;
    }
    
    try {
        const scriptPath = resolveVideoScriptPath();
        if (!scriptPath) {
            console.error('[ERROR] No se pudo resolver la ruta del script _2video.py.');
            return;
        }
        const pythonExecutable = getPythonCommand();
        const alarmTimeISO = alarm.alarmTime.toISOString();
        const dispositivoStr = alarm.dispositivo.toString();
        
        if (!fs.existsSync(scriptPath)) {
            console.error(`[✗] El script no existe en la ruta: ${scriptPath}`);
            return;
        }
        
        let command: string;
        if (process.platform === 'win32') {
            command = `"${pythonExecutable}" "${scriptPath}" ${dispositivoStr} "${alarmTimeISO}" ${alarm.guid}`;
        } else {
            command = `${pythonExecutable} "${scriptPath}" "${dispositivoStr}" "${alarmTimeISO}" "${alarm.guid}"`;
        }
        
        console.log(`[▶] Ejecutando comando para descarga de video: ${command}`);
        
        const execOptions: ExecOptions = {
            cwd: path.dirname(scriptPath),
            env: process.env,
            shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
            windowsHide: true
        };
        
        exec(command, execOptions, (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
            const stdoutStr = stdout.toString();
            const stderrStr = stderr.toString();
            if (error) {
                console.error(`[✗] Error al ejecutar script de video para alarma ${alarm.guid}:`, error.message);
                console.error(`[✗] Error completo:`, error);
            }
            if (stderrStr) {
                console.error(`[!] Stderr de script de video para alarma ${alarm.guid}:`, stderrStr);
            }
            if (stdoutStr) {
                console.log(`[✓] Stdout de script de video para alarma ${alarm.guid}:`, stdoutStr);
            }
        });
        
    } catch (error) {
        console.error(`[✗] Error al configurar la ejecución del script de video:`, error);
    }
};

/**
 * Busca alarmas sospechosas sin video y reinicia la descarga
 */
const retryFailedVideoDownloads = async () => {
    try {
        console.log('[🔄] Iniciando búsqueda de alarmas sospechosas sin video...');
        
        // Limpiar tracking antiguo
        cleanupOldTracking();
        
        // Calcular fecha límite (últimos 2 días) ya que los videos se almacenan solo 2 días
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        // Buscar alarmas en estado "Sospechosa" que no tienen video y son de los últimos 2 días
        const alarmsWithoutVideo = await prisma.alarmasHistorico.findMany({
            where: {
                estado: 'Sospechosa',
                OR: [
                    { video: null },
                    { video: '' }
                ],
                alarmTime: {
                    gte: twoDaysAgo
                }
            },
            select: {
                guid: true,
                dispositivo: true,
                alarmTime: true,
                estado: true,
                interno: true
            },
            orderBy: {
                alarmTime: 'desc'
            }
        });

        if (alarmsWithoutVideo.length === 0) {
            console.log('[✓] No hay alarmas sospechosas sin video que requieran reintento.');
            return;
        }

        // Filtrar alarmas que no han alcanzado el límite de 10 reintentos
        const alarmsToRetry = alarmsWithoutVideo.filter(alarm => {
            const retryCount = getRetryCount(alarm.guid);
            return retryCount < 10;
        });

        if (alarmsToRetry.length === 0) {
            const exhaustedCount = alarmsWithoutVideo.length;
            console.log(`[⚠] ${exhaustedCount} alarma(s) sin video han alcanzado el límite de 10 reintentos.`);
            return;
        }

        console.log(`[!] Se encontraron ${alarmsToRetry.length} alarma(s) sospechosa(s) sin video que requieren reintento.`);
        console.log(`[ℹ] ${alarmsWithoutVideo.length - alarmsToRetry.length} alarma(s) han alcanzado el límite de reintentos.`);
        
        // Ordenar alarmas por fecha más reciente primero (priorizar las más nuevas)
        alarmsToRetry.sort((a, b) => {
            const dateA = a.alarmTime ? new Date(a.alarmTime).getTime() : 0;
            const dateB = b.alarmTime ? new Date(b.alarmTime).getTime() : 0;
            return dateB - dateA; // Más reciente primero
        });
        
        // Reintentar la descarga para cada alarma
        for (const alarm of alarmsToRetry) {
            const newRetryCount = incrementRetryCount(alarm.guid);
            
            console.log(`[🔄] Reintentando descarga de video para alarma ${alarm.guid} (Interno: ${alarm.interno || 'N/A'}) - Intento ${newRetryCount}/10`);
            
            // Ejecutar el script de descarga
            triggerVideoScript({
                guid: alarm.guid,
                dispositivo: alarm.dispositivo,
                alarmTime: alarm.alarmTime
            });
            
            // Pausa de 60 segundos entre ejecuciones para no sobrecargar el sistema
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
        
        console.log(`[✓] Se iniciaron ${alarmsToRetry.length} reintento(s) de descarga de video.`);
        
    } catch (error) {
        console.error('[✗] Error al buscar y reintentar descargas de video:', error);
    }
};

/**
 * Inicia el servicio de reintentos automáticos cada 60 minutos
 */
export const startVideoRetryService = () => {
    console.log('[🚀] Iniciando servicio de reintentos automáticos de descarga de videos...');
    
    // Cargar el tracker de reintentos desde el archivo
    loadRetryTracker();
    
    // Ejecutar inmediatamente al iniciar el servidor
    console.log('[▶️] Ejecutando chequeo inicial de reintentos al iniciar servidor...');
    retryFailedVideoDownloads();
    
    // Programar la tarea para ejecutarse cada 60 minutos (1 hora)
    // Formato cron: '0 * * * *' = cada hora en punto
    cron.schedule('0 * * * *', async () => {
        console.log('[⏰] Ejecutando tarea programada de reintentos de video...');
        await retryFailedVideoDownloads();
    });
    
    console.log('[✓] Servicio de reintentos automáticos configurado (cada 60 minutos)');
};

/**
 * Ejecutar manualmente el reintento (útil para testing o ejecución manual)
 */
export const manualRetryCheck = async () => {
    await retryFailedVideoDownloads();
};

/**
 * Obtiene estadísticas del tracker de reintentos
 */
export const getRetryStats = () => {
    const stats = {
        totalTracked: Object.keys(retryTracker).length,
        byRetryCount: {} as { [count: number]: number },
        alarms: Object.entries(retryTracker).map(([guid, info]) => ({
            guid,
            retryCount: info.retryCount,
            lastRetryAt: info.lastRetryAt,
            firstRetryAt: info.firstRetryAt
        }))
    };
    
    // Contar por número de reintentos
    for (const info of Object.values(retryTracker)) {
        const count = info.retryCount;
        stats.byRetryCount[count] = (stats.byRetryCount[count] || 0) + 1;
    }
    
    return stats;
};

/**
 * Reinicia el contador de una alarma específica (útil para reintentar manualmente)
 */
export const resetAlarmRetryCount = (alarmGuid: string): boolean => {
    if (retryTracker[alarmGuid]) {
        clearRetryTracking(alarmGuid);
        console.log(`[✓] Contador de reintentos reiniciado para alarma ${alarmGuid}`);
        return true;
    }
    return false;
};
