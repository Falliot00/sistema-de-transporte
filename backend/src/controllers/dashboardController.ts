// backend/src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

/**
 * @route GET /api/dashboard/summary
 * @description Obtiene datos agregados para todo el dashboard.
 */
export const getSummary = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ message: 'Los parámetros startDate y endDate son requeridos.' });
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        const endOfWeek = new Date(end);
        const startOfWeek = new Date(endOfWeek);
        startOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay());
        startOfWeek.setUTCHours(0, 0, 0, 0);
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setDate(startOfWeek.getDate() - 1);
        endOfLastWeek.setUTCHours(23, 59, 59, 999);

        const [
            kpiData,
            alarmsByDay,
            alarmsByType,
            alarmsByStatus,
            hourlyDistribution,
            weeklyTrend,
            driverRanking,
            deviceSummary
        ] = await Promise.all([
            prisma.alarmasHistorico.aggregate({ _count: { guid: true }, where: { alarmTime: { gte: start, lte: end } } }),
            prisma.$queryRaw`SELECT CAST(alarmTime AS DATE) as date, COUNT(*) as total, SUM(CASE WHEN estado IN ('Confirmada', 'confirmed') THEN 1 ELSE 0 END) as confirmed, SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pending FROM alarmasHistorico WHERE alarmTime >= ${start} AND alarmTime <= ${end} GROUP BY CAST(alarmTime AS DATE) ORDER BY date ASC;`,
            prisma.alarmasHistorico.groupBy({ by: ['alarmTypeId'], where: { alarmTime: { gte: start, lte: end }, alarmTypeId: { not: null } }, _count: { alarmTypeId: true }, orderBy: { _count: { alarmTypeId: 'desc' } } }),
            prisma.alarmasHistorico.groupBy({ by: ['estado'], where: { alarmTime: { gte: start, lte: end } }, _count: { estado: true } }),
            prisma.$queryRaw`SELECT DATEPART(hour, alarmTime) as hour, COUNT(*) as count FROM alarmasHistorico WHERE alarmTime >= ${start} AND alarmTime <= ${end} GROUP BY DATEPART(hour, alarmTime) ORDER BY hour ASC;`,
            prisma.$queryRaw`SELECT DATENAME(weekday, alarmTime) as dayName, DATEPART(weekday, alarmTime) as dayOfWeek, SUM(CASE WHEN alarmTime >= ${startOfWeek} AND alarmTime <= ${endOfWeek} THEN 1 ELSE 0 END) as thisWeek, SUM(CASE WHEN alarmTime >= ${startOfLastWeek} AND alarmTime <= ${endOfLastWeek} THEN 1 ELSE 0 END) as lastWeek FROM alarmasHistorico WHERE alarmTime >= ${startOfLastWeek} AND alarmTime <= ${endOfWeek} GROUP BY DATENAME(weekday, alarmTime), DATEPART(weekday, alarmTime) ORDER BY dayOfWeek ASC;`,
            
            // --- INICIO DE LA SOLUCIÓN: Corregir el nombre de la columna en el JOIN ---
            // Se cambia a.choferId por a.chofer para que coincida con el nombre de la columna física en la DB.
            prisma.$queryRaw`
                SELECT
                    c.choferes_id, c.nombre, c.apellido, c.foto,
                    COUNT(a.guid) as totalAlarms,
                    SUM(CASE WHEN a.estado IN ('Confirmada', 'confirmed') THEN 1 ELSE 0 END) as confirmedAlarms
                FROM Choferes c
                LEFT JOIN alarmasHistorico a ON c.choferes_id = a.chofer AND a.alarmTime >= ${start} AND a.alarmTime <= ${end}
                GROUP BY c.choferes_id, c.nombre, c.apellido, c.foto
                ORDER BY totalAlarms DESC;
            `,
            // --- FIN DE LA SOLUCIÓN ---

            prisma.alarmasHistorico.groupBy({
                by: ['dispositivo'],
                _count: { dispositivo: true },
                where: { alarmTime: { gte: start, lte: end } },
                orderBy: { _count: { dispositivo: 'desc' } },
                take: 5
            })
        ]);

        const totalAlarms = kpiData._count.guid;
        const typeAlarms = await prisma.typeAlarms.findMany();
        const typeMap = new Map(typeAlarms.map(t => [t.type, t.alarm]));
        const alarmsByTypeProcessed = (alarmsByType as any[]).map(item => ({
            name: typeMap.get(item.alarmTypeId) || 'Desconocido',
            value: item._count.alarmTypeId,
        }));
        
        const statusCounts: { [key: string]: number } = {};
        (alarmsByStatus as any[]).forEach(item => {
            if(item.estado) { statusCounts[item.estado.toLowerCase()] = item._count.estado; }
        });
        const confirmedCount = (statusCounts['confirmada'] || 0) + (statusCounts['confirmed'] || 0);
        const rejectedCount = (statusCounts['rechazada'] || 0) + (statusCounts['rejected'] || 0);
        const totalProcessed = confirmedCount + rejectedCount;
        const confirmationRate = totalProcessed > 0 ? (confirmedCount / totalProcessed) * 100 : 0;

        const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, alarmas: 0 }));
        (hourlyDistribution as any[]).forEach(item => {
            hourlyData[item.hour].alarmas = item.count;
        });

        const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const weeklyDataMap = new Map(weekDays.map(day => [day, { EsteSemana: 0, SemanaPasada: 0 }]));
        (weeklyTrend as any[]).forEach(item => {
            const day = item.dayName.charAt(0).toUpperCase() + item.dayName.slice(1);
            if(weeklyDataMap.has(day)) {
                weeklyDataMap.set(day, { EsteSemana: item.thisWeek, SemanaPasada: item.lastWeek });
            }
        });
        const weeklyData = Array.from(weeklyDataMap.entries()).map(([name, values]) => ({ name: name.substring(0, 3), ...values }));
        
        const driverRankingProcessed = (driverRanking as any[]).map(driver => {
            const total = driver.totalAlarms || 0;
            const confirmed = driver.confirmedAlarms || 0;
            return {
                id: driver.choferes_id,
                name: `${driver.nombre} ${driver.apellido}`,
                avatar: driver.foto,
                totalAlarms: total,
                confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
                efficiencyScore: total > 0 ? Math.round(100 - ((confirmed / total) * 100)) : 100,
            };
        }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);

        const totalUniqueDevices = await prisma.alarmasHistorico.findMany({
            where: { alarmTime: { gte: start, lte: end }, dispositivo: { not: null }},
            distinct: ['dispositivo']
        }).then(d => d.length);

        const deviceSummaryProcessed = {
            active: totalUniqueDevices,
            maintenance: 0,
            offline: 0,
            total: totalUniqueDevices,
        };

        const topDevicesProcessed = (deviceSummary as any[]).map(device => ({
            id: device.dispositivo,
            name: `Dispositivo ${device.dispositivo}`,
            serialNumber: device.dispositivo,
            alarmCount: device._count.dispositivo,
            status: 'active'
        }));
        
        const summaryPayload = {
            kpis: {
                totalAlarms,
                confirmationRate: confirmationRate.toFixed(1),
            },
            alarmsByDay: (alarmsByDay as any[]).map(d => ({
                name: new Date(d.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                Total: d.total,
                Confirmadas: d.confirmed,
                Pendientes: d.pending,
            })),
            alarmsByType: alarmsByTypeProcessed,
            alarmStatusProgress: [
                { title: 'Pendientes', value: statusCounts['pendiente'] || 0, total: totalAlarms },
                { title: 'Sospechosas', value: statusCounts['sospechosa'] || 0, total: totalAlarms },
                { title: 'Confirmadas', value: confirmedCount, total: totalAlarms },
            ],
            hourlyDistribution: hourlyData,
            weeklyTrend: weeklyData,
            driverRanking: driverRankingProcessed,
            deviceSummary: deviceSummaryProcessed,
            topDevices: topDevicesProcessed
        };

        res.status(200).json(summaryPayload);

    } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};