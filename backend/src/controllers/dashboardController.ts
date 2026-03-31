// backend/src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIRMED_STATUSES = ['Confirmada', 'confirmed'];

export const getSummary = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    try {
        // --- Build date filter conditions ---
        let dateConditionAH = Prisma.empty;   // for alarmasHistorico alias 'ah'
        let dateConditionNoAlias = Prisma.empty; // for alarmasHistorico without alias
        let dateConditionA = Prisma.empty;     // for alias 'a'

        let start: Date | null = null;
        let end: Date | null = null;

        if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
            start = new Date(startDate as string);
            end = new Date(endDate as string);
            end.setUTCHours(23, 59, 59, 999);
            dateConditionAH = Prisma.sql`AND ah.alarmTime >= ${start} AND ah.alarmTime <= ${end}`;
            dateConditionNoAlias = Prisma.sql`WHERE alarmTime >= ${start} AND alarmTime <= ${end}`;
            dateConditionA = Prisma.sql`WHERE a.alarmTime >= ${start} AND a.alarmTime <= ${end}`;
        }

        // ===================== GLOBAL DATA =====================

        // Total alarms + date range
        const globalDataPromise = prisma.$queryRaw<any[]>`
            SELECT 
                COUNT(*) as totalAlarms,
                MIN(alarmTime) as oldestDate,
                MAX(alarmTime) as newestDate
            FROM alarmas.alarmasHistorico
            ${dateConditionNoAlias}
        `;

        // ===================== PROCESO A =====================
        // Base: alarmasHistorico (1 alarma = 1 guid), con LEFT JOIN a logAlarmas.
        // Pendientes se calcula como "sin procesar por A":
        // sin transicion a Sospechosa ni rechazo directo desde Pendiente.

        const procesoAMetricsPromise = prisma.$queryRaw<any[]>`
            WITH cambios AS (
                SELECT
                    ah.guid,
                    MAX(CASE WHEN la.estado_new = 'Sospechosa' THEN 1 ELSE 0 END) AS esSospechada,
                    MAX(CASE WHEN la.estado_old = 'Pendiente' AND la.estado_new = 'Rechazada' THEN 1 ELSE 0 END) AS esRechazada
                FROM alarmas.alarmasHistorico ah
                LEFT JOIN alarmas.logAlarmas la ON ah.guid = la.guid
                WHERE 1=1 ${dateConditionAH}
                GROUP BY ah.guid
            )
            SELECT
                COALESCE(SUM(esSospechada), 0) AS sospechadas,
                COALESCE(SUM(esRechazada), 0) AS rechazadas,
                COALESCE(SUM(CASE WHEN esSospechada = 0 AND esRechazada = 0 THEN 1 ELSE 0 END), 0) AS pendientes
            FROM cambios
        `;

        // Volumen de alarmas totales por dia (from alarmasHistorico)
        const volumenTotalPorDiaPromise = prisma.$queryRaw<any[]>`
            SELECT 
                CAST(alarmTime AS DATE) as date,
                COUNT(*) as total
            FROM alarmas.alarmasHistorico
            ${dateConditionNoAlias}
            GROUP BY CAST(alarmTime AS DATE)
            ORDER BY date ASC
        `;

        // Alarmas por dia para Proceso A: Pendientes(sin procesar) + Rechazadas_A
        const alarmasPorDiaAPromise = prisma.$queryRaw<any[]>`
            WITH cambios AS (
                SELECT
                    CAST(ah.alarmTime AS DATE) AS fecha,
                    ah.guid,
                    MAX(CASE WHEN la.estado_new = 'Sospechosa' THEN 1 ELSE 0 END) AS esSospechada,
                    MAX(CASE WHEN la.estado_old = 'Pendiente' AND la.estado_new = 'Rechazada' THEN 1 ELSE 0 END) AS esRechazada
                FROM alarmas.alarmasHistorico ah
                LEFT JOIN alarmas.logAlarmas la ON ah.guid = la.guid
                WHERE 1=1 ${dateConditionAH}
                GROUP BY CAST(ah.alarmTime AS DATE), ah.guid
            )
            SELECT
                fecha as date,
                COUNT(*) AS cantidad,
                COALESCE(SUM(CASE WHEN esSospechada = 1 OR esRechazada = 1 THEN 1 ELSE 0 END), 0) AS procesadas,
                COALESCE(SUM(CASE WHEN esSospechada = 0 AND esRechazada = 0 THEN 1 ELSE 0 END), 0) AS pendientes,
                COALESCE(SUM(esSospechada), 0) AS sospechosas,
                COALESCE(SUM(esRechazada), 0) AS rechazadas
            FROM cambios
            GROUP BY fecha
            ORDER BY fecha ASC
        `;

        // Distribucion horaria
        const distribucionHorariaPromise = prisma.$queryRaw<any[]>`
            SELECT DATEPART(hour, alarmTime) as hour, COUNT(*) as count 
            FROM alarmas.alarmasHistorico
            ${dateConditionNoAlias}
            GROUP BY DATEPART(hour, alarmTime) ORDER BY hour ASC
        `;

        // ===================== PROCESO B =====================
        // Proceso B: base en transiciones desde/hacia Sospechosa, deduplicadas por guid.

        const procesoBMetricsPromise = prisma.$queryRaw<any[]>`
            WITH cambios AS (
                SELECT
                    ah.guid,
                    MAX(CASE WHEN la.estado_new = 'Sospechosa' THEN 1 ELSE 0 END) AS fueSospechosa,
                    MAX(CASE WHEN la.estado_old = 'Sospechosa' THEN 1 ELSE 0 END) AS fueProcesadaDesdeSospechosa,
                    MAX(CASE WHEN la.estado_old = 'Sospechosa' AND la.estado_new = 'Confirmada' THEN 1 ELSE 0 END) AS fueConfirmada,
                    MAX(CASE WHEN la.estado_old = 'Sospechosa' AND la.estado_new = 'Rechazada' THEN 1 ELSE 0 END) AS fueRechazada
                FROM alarmas.alarmasHistorico ah
                INNER JOIN alarmas.logAlarmas la ON ah.guid = la.guid
                WHERE 1=1 ${dateConditionAH}
                GROUP BY ah.guid
            )
            SELECT
                COALESCE(SUM(fueSospechosa), 0) AS totalSospechosas,
                COALESCE(SUM(fueProcesadaDesdeSospechosa), 0) AS sospechosasProcesadas,
                COALESCE(SUM(CASE WHEN fueSospechosa = 1 AND fueProcesadaDesdeSospechosa = 0 THEN 1 ELSE 0 END), 0) AS sospechosasSinProcesar,
                COALESCE(SUM(fueConfirmada), 0) AS confirmadas,
                COALESCE(SUM(fueRechazada), 0) AS rechazadas
            FROM cambios
        `;

        // Volumen de alarmas sospechosas por dia
        const volumenSospechosasPorDiaPromise = prisma.$queryRaw<any[]>`
            WITH cambios AS (
                SELECT
                    CAST(ah.alarmTime AS DATE) AS fecha,
                    ah.guid,
                    MAX(CASE WHEN la.estado_new = 'Sospechosa' THEN 1 ELSE 0 END) AS fueSospechosa
                FROM alarmas.alarmasHistorico ah
                INNER JOIN alarmas.logAlarmas la ON ah.guid = la.guid
                WHERE 1=1 ${dateConditionAH}
                GROUP BY CAST(ah.alarmTime AS DATE), ah.guid
            )
            SELECT
                fecha as date,
                COALESCE(SUM(fueSospechosa), 0) AS sospechosas
            FROM cambios
            GROUP BY fecha
            ORDER BY fecha ASC
        `;

        // Alarmas por dia para Proceso B: Sospechosas + Rechazadas_B
        const alarmasPorDiaBPromise = prisma.$queryRaw<any[]>`
            WITH cambios AS (
                SELECT
                    CAST(ah.alarmTime AS DATE) AS fecha,
                    ah.guid,
                    MAX(CASE WHEN la.estado_new = 'Sospechosa' THEN 1 ELSE 0 END) AS fueSospechosa,
                    MAX(CASE WHEN la.estado_old = 'Sospechosa' AND la.estado_new = 'Rechazada' THEN 1 ELSE 0 END) AS fueRechazada
                FROM alarmas.alarmasHistorico ah
                INNER JOIN alarmas.logAlarmas la ON ah.guid = la.guid
                WHERE 1=1 ${dateConditionAH}
                GROUP BY CAST(ah.alarmTime AS DATE), ah.guid
            )
            SELECT
                fecha as date,
                COALESCE(SUM(fueSospechosa), 0) AS sospechosas,
                COALESCE(SUM(fueRechazada), 0) AS rechazadas
            FROM cambios
            GROUP BY fecha
            ORDER BY fecha ASC
        `;

        // ===================== CHOFERES =====================

        const rawWhereStatement = start && end
            ? Prisma.sql`WHERE a.alarmTime >= ${start} AND a.alarmTime <= ${end}`
            : Prisma.empty;

        const driverRankingPromise = prisma.$queryRaw<any[]>`
            SELECT c.idEmpleado, c.apellido_nombre, c.foto, COUNT(a.guid) as totalAlarms, 
                   SUM(CASE WHEN a.estado IN (${Prisma.join(CONFIRMED_STATUSES)}) THEN 1 ELSE 0 END) as confirmedAlarms
            FROM dimCentral.empleados c 
            JOIN alarmas.alarmasHistorico a ON c.idEmpleado = a.chofer
            ${rawWhereStatement}
            GROUP BY c.idEmpleado, c.apellido_nombre, c.foto 
            HAVING COUNT(a.guid) > 0 
            ORDER BY confirmedAlarms DESC, totalAlarms DESC
        `;

        // ===================== EXECUTE ALL =====================

        const [
            globalData,
            procesoAMetrics,
            volumenTotalPorDia,
            alarmasPorDiaA,
            distribucionHoraria,
            procesoBMetrics,
            volumenSospechosasPorDia,
            alarmasPorDiaB,
            driverRanking
        ] = await Promise.all([
            globalDataPromise,
            procesoAMetricsPromise,
            volumenTotalPorDiaPromise,
            alarmasPorDiaAPromise,
            distribucionHorariaPromise,
            procesoBMetricsPromise,
            volumenSospechosasPorDiaPromise,
            alarmasPorDiaBPromise,
            driverRankingPromise
        ]);

        // ===================== PROCESS RESULTS =====================

        const global = globalData[0] || { totalAlarms: 0, oldestDate: null, newestDate: null };
        const totalAlarms = Number(global.totalAlarms) || 0;
        const oldestDate = global.oldestDate ? new Date(global.oldestDate).toISOString() : null;
        const newestDate = global.newestDate ? new Date(global.newestDate).toISOString() : null;

        // Proceso A
        const pA = procesoAMetrics[0] || { sospechadas: 0, rechazadas: 0, pendientes: 0 };
        const procesoA = {
            sospechadas: Number(pA.sospechadas) || 0,
            rechazadas: Number(pA.rechazadas) || 0,
            pendientes: Number(pA.pendientes) || 0,
            volumenPorDia: (volumenTotalPorDia || []).map((d: any) => ({
                name: new Date(d.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                Total: Number(d.total) || 0,
            })),
            alarmasPorDia: (alarmasPorDiaA || []).map((d: any) => ({
                name: new Date(d.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                Pendientes: Number(d.pendientes) || 0,
                Rechazadas: Number(d.rechazadas) || 0,
            })),
            distribucionHoraria: (() => {
                const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, alarmas: 0 }));
                (distribucionHoraria || []).forEach((item: any) => {
                    if (item.hour !== null && item.hour >= 0 && item.hour < 24) {
                        hourlyData[item.hour].alarmas = Number(item.count);
                    }
                });
                return hourlyData;
            })(),
        };

        // Proceso B
        const pB = procesoBMetrics[0] || { totalSospechosas: 0, sospechosasSinProcesar: 0, confirmadas: 0, rechazadas: 0 };
        const totalSospechosas = Number(pB.totalSospechosas) || 0;
        const confirmadasB = Number(pB.confirmadas) || 0;
        const rechazadasB = Number(pB.rechazadas) || 0;
        const sospechosasSinProcesar = Number(pB.sospechosasSinProcesar) || 0;
        const tasaConfirmacion = totalSospechosas > 0 ? (confirmadasB / totalSospechosas) * 100 : 0;

        const procesoB = {
            confirmadas: confirmadasB,
            rechazadas: rechazadasB,
            sospechosasSinProcesar: sospechosasSinProcesar > 0 ? sospechosasSinProcesar : 0,
            tasaConfirmacion: tasaConfirmacion.toFixed(1),
            volumenSospechosasPorDia: (volumenSospechosasPorDia || []).map((d: any) => ({
                name: new Date(d.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                Sospechosas: Number(d.sospechosas) || 0,
            })),
            alarmasPorDia: (alarmasPorDiaB || []).map((d: any) => ({
                name: new Date(d.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                Sospechosas: Number(d.sospechosas) || 0,
                Rechazadas: Number(d.rechazadas) || 0,
            })),
        };

        // Choferes
        const driverRankingProcessed = (driverRanking || []).map((driver: any) => {
            const total = Number(driver.totalAlarms) || 0;
            const confirmed = Number(driver.confirmedAlarms) || 0;
            const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
            return {
                id: driver.idEmpleado,
                name: driver.apellido_nombre,
                avatar: driver.foto,
                totalAlarms: total,
                confirmedAlarms: confirmed,
                confirmationRate,
                efficiencyScore: 100 - confirmationRate,
            };
        });

        // ===================== RESPONSE =====================

        const summaryPayload = {
            totalAlarms,
            oldestDate,
            newestDate,
            procesoA,
            procesoB,
            driverRanking: driverRankingProcessed,
        };

        res.status(200).json(summaryPayload);

    } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
