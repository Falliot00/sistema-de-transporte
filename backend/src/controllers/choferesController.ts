// backend/src/controllers/choferesController.ts
import { Request, Response } from 'express';
import { PrismaClient, Choferes } from '@prisma/client'; // Importamos el tipo Choferes
import { transformAlarmData } from '../utils/transformers';

const prisma = new PrismaClient();

const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

export const getAllChoferes = async (req: Request, res: Response) => {
    const { search } = req.query;
    let whereClause: any = {};

    if (search && typeof search === 'string') {
        whereClause.OR = [
            // CORRECCIÓN: Buscamos en el campo 'apellido_nombre'
            { apellido_nombre: { contains: search } },
            { dni: { contains: search } },
        ];
    }

    try {
        const choferesFromDb = await prisma.choferes.findMany({
            where: whereClause,
            // CORRECCIÓN: Ordenamos por el campo 'apellido_nombre'
            orderBy: [{ apellido_nombre: 'asc' }],
        });
        
        const choferes = choferesFromDb.map((chofer: Choferes) => {
            // CORRECCIÓN: Leemos desde 'chofer.apellido_nombre'
            const apellidoNombre = chofer.apellido_nombre || '';
            
            const parts = apellidoNombre.includes(',') 
                ? apellidoNombre.split(',').map((s: string) => s.trim())
                : apellidoNombre.split(' ');
            
            const apellido = parts[0] || '';
            const nombre = parts.slice(1).join(' ') || '';
            
            return {
                choferes_id: chofer.choferes_id,
                nombre: nombre || apellidoNombre,
                apellido: apellido,
                foto: chofer.foto,
                dni: chofer.dni,
                anios: chofer.anios, // 'anios' ahora es el legajo
                empresa: chofer.idEmpresa ? `Empresa ${chofer.idEmpresa}` : null,
                estado: chofer.estado,
                sector: chofer.sector,
                puesto: chofer.puesto,
            };
        });
        
        res.status(200).json(choferes);
    } catch (error) {
        console.error("Error al obtener la lista de choferes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getDriverByIdWithStats = async (req: Request, res: Response) => {
    const { id } = req.params;
    const driverId = parseInt(id, 10);

    if (isNaN(driverId)) {
        return res.status(400).json({ message: 'El ID del chofer debe ser un número.' });
    }

    try {
        const driver = await prisma.choferes.findUnique({
            // CORRECCIÓN: Buscamos por el campo ID 'choferes_id'
            where: { choferes_id: driverId }, 
            include: {
                // CORRECCIÓN: La relación se llama 'alarmas'
                alarmas: { 
                    take: 10,
                    orderBy: { alarmTime: 'desc' },
                    // CORRECCIÓN: La relación inversa se llama 'chofer'
                    include: { typeAlarm: true, chofer: true } 
                }
            }
        });

        if (!driver) {
            return res.status(404).json({ message: 'Chofer no encontrado.' });
        }

        const [totalAlarms, pendingAlarms, suspiciousAlarms, confirmedAlarms, rejectedAlarms] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { choferId: driverId } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.pending } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.suspicious } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.confirmed } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.rejected } } }),
        ]);

        const recentAlarmsTransformed = driver.alarmas.map(transformAlarmData);
        
        // CORRECCIÓN: Leemos desde 'driver.apellido_nombre'
        const apellidoNombre = driver.apellido_nombre || '';
        const parts = apellidoNombre.includes(',') 
            ? apellidoNombre.split(',').map((s: string) => s.trim())
            : apellidoNombre.split(' ');
        
        const apellido = parts[0] || '';
        const nombre = parts.slice(1).join(' ') || '';
        
        const responsePayload = {
            choferes_id: driver.choferes_id,
            nombre: nombre,
            apellido: apellido,
            foto: driver.foto,
            dni: driver.dni,
            anios: driver.anios, // 'anios' ahora es el legajo
            empresa: driver.idEmpresa ? `Empresa ${driver.idEmpresa}` : null,
            stats: {
                total: totalAlarms,
                pending: pendingAlarms,
                suspicious: suspiciousAlarms,
                confirmed: confirmedAlarms,
                rejected: rejectedAlarms,
            },
            alarmas: recentAlarmsTransformed
        };

        res.status(200).json(responsePayload);
    } catch (error) {
        console.error(`Error al obtener detalles del chofer ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};