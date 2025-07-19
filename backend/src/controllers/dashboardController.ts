// backend/src/controllers/dashboardController.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIRMED_STATUSES = ['Confirmada', 'confirmed'];
const REJECTED_STATUSES = ['Rechazada', 'rejected'];

const buildDashboardWhereClause = (queryParams: any): Prisma.AlarmasHistoricoWhereInput => {
    const { startDate, endDate, type, company } = queryParams;
    
    let whereClause: Prisma.AlarmasHistoricoWhereInput = {};

    if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setUTCHours(23, 59, 59, 999);
        whereClause.alarmTime = { gte: start, lte: end };
    }

    const typeFilters = Array.isArray(type) ? type : (type ? [type] : []);
    if (typeFilters.length > 0) {
        whereClause.typeAlarm = { alarm: { in: typeFilters } };
    }
    
    const companyFilters = Array.isArray(company) ? company : (company ? [company] : []);
    if (companyFilters.length > 0) {
        const lowerCaseCompanies = companyFilters.map(c => c.toLowerCase());
        whereClause.empresaInfo = { 
            nombreMin: { 
                in: lowerCaseCompanies 
            } 
        };
    }
    
    return whereClause;
};


export const getSummary = async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    try {
        const whereClause = buildDashboardWhereClause(req.query);

        // Lógica para construir la cláusula WHERE en queries RAW
        const rawWhereConditions: Prisma.Sql[] = [];
        if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
            rawWhereConditions.push(Prisma.sql`a.alarmTime >= ${new Date(startDate as string)} AND a.alarmTime <= ${new Date(endDate as string)}`);
        }
        const rawWhereStatement = rawWhereConditions.length > 0 
            ? Prisma.sql`WHERE ${Prisma.join(rawWhereConditions, ' AND ')}` 
            : Prisma.empty;
        
        // Versión para queries que no usan el alias 'a'
        const rawWhereStatementNoAlias = rawWhereConditions.length > 0 
            ? Prisma.sql`WHERE alarmTime >= ${new Date(startDate as string)} AND alarmTime <= ${new Date(endDate as string)}` 
            : Prisma.empty;

        const [
            kpiData,
            alarmsByDay,
            alarmsByType,
            alarmsByStatus,
            hourlyDistribution,
            driverRanking,
            topDevices,
            avgAlarmsPerDriverData,
            avgAlarmsPerDeviceData
        ] = await Promise.all([
            prisma.alarmasHistorico.groupBy({ by: ['estado'], where: whereClause, _count: { guid: true } }),
            prisma.$queryRaw`
                SELECT CAST(alarmTime AS DATE) as date, COUNT(*) as total, 
                       SUM(CASE WHEN estado IN (${Prisma.join(CONFIRMED_STATUSES)}) THEN 1 ELSE 0 END) as confirmed, 
                       SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pending 
                FROM alarmas.alarmasHistorico
                ${rawWhereStatementNoAlias}
                GROUP BY CAST(alarmTime AS DATE) ORDER BY date ASC;
            `,
            prisma.alarmasHistorico.groupBy({ by: ['alarmTypeId'], where: whereClause, _count: { alarmTypeId: true }, orderBy: { _count: { alarmTypeId: 'desc' } } }),
            prisma.alarmasHistorico.groupBy({ by: ['estado'], where: whereClause, _count: { estado: true } }),
            prisma.$queryRaw`
                SELECT DATEPART(hour, alarmTime) as hour, COUNT(*) as count 
                FROM alarmas.alarmasHistorico
                ${rawWhereStatementNoAlias}
                GROUP BY DATEPART(hour, alarmTime) ORDER BY hour ASC;
            `,
            prisma.$queryRaw`
                SELECT c.idEmpleado, c.apellido_nombre, c.foto, COUNT(a.guid) as totalAlarms, SUM(CASE WHEN a.estado IN (${Prisma.join(CONFIRMED_STATUSES)}) THEN 1 ELSE 0 END) as confirmedAlarms
                FROM dimCentral.empleados c 
                JOIN alarmas.alarmasHistorico a ON c.idEmpleado = a.chofer
                ${rawWhereStatement}
                GROUP BY c.idEmpleado, c.apellido_nombre, c.foto HAVING COUNT(a.guid) > 0 ORDER BY confirmedAlarms DESC, totalAlarms DESC;`,
            prisma.$queryRaw`
                SELECT TOP 10 d.nroInterno, d.patente, d.idDispositivo, COUNT(a.guid) as alarmCount
                FROM alarmas.dispositivos d 
                JOIN alarmas.alarmasHistorico a ON d.idDispositivo = a.dispositivo
                ${rawWhereStatement}
                GROUP BY d.nroInterno, d.patente, d.idDispositivo HAVING COUNT(a.guid) > 0 ORDER BY alarmCount DESC;`,
            prisma.$queryRaw`
                SELECT 
                    CAST(COUNT(*) AS FLOAT) AS total_confirmed_alarms, 
                    CAST(COUNT(DISTINCT chofer) AS FLOAT) AS total_drivers_with_alarms
                FROM alarmas.alarmasHistorico a
                ${rawWhereStatement.text ? Prisma.sql`${rawWhereStatement} AND a.estado IN (${Prisma.join(CONFIRMED_STATUSES)}) AND a.chofer IS NOT NULL` : Prisma.sql`WHERE a.estado IN (${Prisma.join(CONFIRMED_STATUSES)}) AND a.chofer IS NOT NULL`};`,
            prisma.$queryRaw`
                SELECT 
                    CAST(COUNT(*) AS FLOAT) AS total_confirmed_alarms, 
                    CAST(COUNT(DISTINCT dispositivo) AS FLOAT) AS total_devices_with_alarms
                FROM alarmas.alarmasHistorico a
                ${rawWhereStatement.text ? Prisma.sql`${rawWhereStatement} AND a.estado IN (${Prisma.join(CONFIRMED_STATUSES)}) AND a.dispositivo IS NOT NULL` : Prisma.sql`WHERE a.estado IN (${Prisma.join(CONFIRMED_STATUSES)}) AND a.dispositivo IS NOT NULL`};`
        ]);

        // --- PROCESAMIENTO DE DATOS ---
        const totalAlarms = kpiData.reduce((acc, item) => acc + (item._count.guid || 0), 0);
        const confirmedCount = kpiData.find(item => CONFIRMED_STATUSES.includes(item.estado || ''))?._count.guid || 0;
        const rejectedCount = kpiData.find(item => REJECTED_STATUSES.includes(item.estado || ''))?._count.guid || 0;
        const totalProcessed = confirmedCount + rejectedCount;
        const confirmationRate = totalProcessed > 0 ? (confirmedCount / totalProcessed) * 100 : 0;

        const avgDriverData = (avgAlarmsPerDriverData as any[])?.[0] || { total_confirmed_alarms: 0, total_drivers_with_alarms: 0 };
        const avgAlarmsPerDriver = avgDriverData.total_drivers_with_alarms > 0 ? (avgDriverData.total_confirmed_alarms / avgDriverData.total_drivers_with_alarms).toFixed(1) : "0.0";

        const avgDeviceData = (avgAlarmsPerDeviceData as any[])?.[0] || { total_confirmed_alarms: 0, total_devices_with_alarms: 0 };
        const avgAlarmsPerDevice = avgDeviceData.total_devices_with_alarms > 0 ? (avgDeviceData.total_confirmed_alarms / avgDeviceData.total_devices_with_alarms).toFixed(1) : "0.0";

        const typeAlarms = await prisma.typeAlarms.findMany();
        const typeMap = new Map(typeAlarms.map(t => [t.type, t.alarm]));
        const alarmsByTypeProcessed = (alarmsByType as any[] || []).map(item => ({
            name: typeMap.get(item.alarmTypeId) || 'Desconocido',
            value: item._count.alarmTypeId,
        }));
        
        const statusCounts: { [key: string]: number } = {};
        (alarmsByStatus as any[] || []).forEach(item => {
            if(item.estado) { statusCounts[item.estado.toLowerCase()] = item._count.estado || 0; }
        });
        
        const alarmsByDayData = (alarmsByDay as any[] || []).map(d => ({
            name: new Date(d.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
            Total: d.total || 0,
            Confirmadas: d.confirmed || 0,
            Pendientes: d.pending || 0,
        }));

        const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, alarmas: 0 }));
        (hourlyDistribution as any[] || []).forEach(item => {
            if (item.hour !== null && item.hour >= 0 && item.hour < 24) {
                hourlyData[item.hour].alarmas = Number(item.count);
            }
        });

        const driverRankingProcessed = (driverRanking as any[] || []).map(driver => {
            const total = Number(driver.totalAlarms) || 0;
            const confirmed = Number(driver.confirmedAlarms) || 0;
            const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
            return { id: driver.idEmpleado, name: driver.apellido_nombre, avatar: driver.foto, totalAlarms: total, confirmedAlarms: confirmed, confirmationRate, efficiencyScore: 100 - confirmationRate };
        });
        
        const topDevicesProcessed = (topDevices as any[] || []).map(device => ({
            id: device.idDispositivo,
            name: `Interno ${device.nroInterno || 'N/A'}`,
            serialNumber: device.patente || 'Sin Patente',
            alarmCount: Number(device.alarmCount) || 0,
            status: 'active'
        }));
        
        const summaryPayload = {
            kpis: { totalAlarms, confirmationRate: confirmationRate.toFixed(1), avgAlarmsPerDriver, avgAlarmsPerDevice },
            alarmsByDay: alarmsByDayData,
            alarmsByType: alarmsByTypeProcessed,
            alarmStatusProgress: [
                { title: 'Pendientes', value: statusCounts['pendiente'] || 0, total: totalAlarms, color: 'hsl(var(--chart-4))' },
                { title: 'Sospechosas', value: statusCounts['sospechosa'] || 0, total: totalAlarms, color: 'hsl(var(--chart-1))' },
                { title: 'Confirmadas', value: (statusCounts['confirmada'] || 0) + (statusCounts['confirmed'] || 0), total: totalAlarms, color: 'hsl(var(--chart-2))' },
            ],
            hourlyDistribution: hourlyData,
            driverRanking: driverRankingProcessed,
            topDevices: topDevicesProcessed
        };

        res.status(200).json(summaryPayload);

    } catch (error) {
        console.error("Error al obtener datos del dashboard:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};