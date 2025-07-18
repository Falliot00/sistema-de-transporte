"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverByIdWithStats = exports.getAllChoferes = void 0;
const client_1 = require("@prisma/client");
const transformers_1 = require("../utils/transformers");
const prisma = new client_1.PrismaClient();
const DB_QUERY_STATUS_MAP = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};
/**
 * @route GET /api/choferes
 * @description Obtiene una lista de todos los choferes, con opción de búsqueda.
 */
const getAllChoferes = async (req, res) => {
    const { search } = req.query;
    let whereClause = {};
    if (search && typeof search === 'string') {
        whereClause.OR = [
            { nombre: { contains: search } },
            { apellido: { contains: search } },
            { dni: { contains: search } },
            { empresa: { contains: search } },
        ];
    }
    try {
        const choferes = await prisma.choferes.findMany({
            where: whereClause,
            orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
        });
        res.status(200).json(choferes);
    }
    catch (error) {
        console.error("Error al obtener la lista de choferes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
exports.getAllChoferes = getAllChoferes;
/**
 * @route GET /api/choferes/:id
 * @description Obtiene detalles y estadísticas de un chofer, incluyendo sus 10 alarmas más recientes.
 */
const getDriverByIdWithStats = async (req, res) => {
    const { id } = req.params;
    const driverId = parseInt(id, 10);
    if (isNaN(driverId)) {
        return res.status(400).json({ message: 'El ID del chofer debe ser un número.' });
    }
    try {
        // Obtenemos el chofer y sus 10 alarmas más recientes en una sola consulta
        const driver = await prisma.choferes.findUnique({
            where: { choferes_id: driverId },
            include: {
                alarmas: {
                    take: 10,
                    orderBy: { alarmTime: 'desc' },
                    include: { typeAlarm: true, chofer: true } // Incluir relaciones para la transformación
                }
            }
        });
        if (!driver) {
            return res.status(404).json({ message: 'Chofer no encontrado.' });
        }
        // Realizamos las consultas de conteo en paralelo
        const [totalAlarms, pendingAlarms, suspiciousAlarms, confirmedAlarms, rejectedAlarms] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { choferId: driverId } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.pending } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.suspicious } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.confirmed } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.rejected } } }),
        ]);
        // Extraemos las alarmas y las transformamos
        const recentAlarmsRaw = driver.alarmas;
        const recentAlarmsTransformed = recentAlarmsRaw.map(transformers_1.transformAlarmData);
        // Creamos el objeto de respuesta final
        const responsePayload = {
            choferes_id: driver.choferes_id,
            nombre: driver.nombre,
            apellido: driver.apellido,
            foto: driver.foto,
            dni: driver.dni,
            anios: driver.anios,
            empresa: driver.empresa,
            stats: {
                total: totalAlarms,
                pending: pendingAlarms,
                suspicious: suspiciousAlarms,
                confirmed: confirmedAlarms,
                rejected: rejectedAlarms,
            },
            alarmas: recentAlarmsTransformed // Adjuntamos las alarmas transformadas
        };
        res.status(200).json(responsePayload);
    }
    catch (error) {
        console.error(`Error al obtener detalles del chofer ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
exports.getDriverByIdWithStats = getDriverByIdWithStats;
