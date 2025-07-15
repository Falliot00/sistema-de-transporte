// backend/src/utils/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import { Choferes, AlarmasHistorico, TypeAlarms, Dispositivos } from '@prisma/client';
import { getEmpresaNameFromId, parseApellidoNombre } from './transformers';

// Tipos para los datos que necesitamos
type AlarmWithDetails = AlarmasHistorico & {
    chofer: Choferes | null;
    typeAlarm: TypeAlarms | null;
    // La relación ahora devuelve el modelo completo de Dispositivos
    deviceInfo: Dispositivos | null;
};

export function generateAlarmReportPDF(alarm: AlarmWithDetails, stream: NodeJS.WritableStream) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(stream);

    // --- ENCABEZADO ---
    doc.fontSize(20).font('Helvetica-Bold').text('Informe de Infracción', { align: 'center' });
    doc.moveDown();

    // --- DATOS PRINCIPALES ---
    doc.fontSize(14).font('Helvetica-Bold').text('Detalles del Evento');
    doc.moveDown(0.5);
    
    const fechaFormateada = alarm.alarmTime 
        ? new Date(alarm.alarmTime).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'medium' })
        : 'No disponible';

    doc.fontSize(12).font('Helvetica').text(`ID de Alarma: ${alarm.guid}`);
    doc.text(`Fecha y Hora: ${fechaFormateada}`);
    doc.text(`Tipo de Alarma: ${alarm.typeAlarm?.alarm || 'Desconocido'}`);
    doc.text(`Estado Actual: ${alarm.estado || 'No definido'}`);
    doc.text(`Empresa (de la alarma): ${alarm.Empresa || 'No definida'}`);
    doc.moveDown();

    // --- DATOS DEL VEHÍCULO ---
    doc.fontSize(14).font('Helvetica-Bold').text('Información del Vehículo');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Interno: ${alarm.interno || 'N/A'}`);
    doc.text(`Patente: ${alarm.deviceInfo?.patente || 'No disponible'}`);
    doc.text(`Dispositivo ID: ${alarm.dispositivo || 'N/A'}`);
    doc.text(`Velocidad Registrada: ${alarm.velocidad !== null ? alarm.velocidad + ' km/h' : 'N/A'}`);
    doc.moveDown();
    
    // --- DATOS DEL CHOFER ---
    doc.fontSize(14).font('Helvetica-Bold').text('Información del Chofer');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');

    if (alarm.chofer) {
        const { nombre, apellido } = parseApellidoNombre(alarm.chofer.apellido_nombre);
        
        // --- SOLUCIÓN: Usar la función de mapeo para la empresa del chofer ---
        const nombreEmpresaChofer = getEmpresaNameFromId(alarm.chofer.idEmpresa);

        doc.text(`Nombre: ${nombre} ${apellido}`);
        doc.text(`DNI: ${alarm.chofer.dni || 'No disponible'}`);
        doc.text(`Legajo: ${alarm.chofer.anios || 'No disponible'}`);
        doc.text(`Empresa (del chofer): ${nombreEmpresaChofer}`); // Ahora muestra el nombre correcto
    } else {
        doc.text('Chofer no asignado a esta alarma.');
    }
    doc.moveDown();
    
    // --- DESCRIPCIÓN Y UBICACIÓN ---
    if (alarm.descripcion) {
        doc.fontSize(14).font('Helvetica-Bold').text('Descripción del Analista');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(alarm.descripcion);
        doc.moveDown();
    }
    
    doc.fontSize(14).font('Helvetica-Bold').text('Ubicación del Evento');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(alarm.ubi || 'Ubicación no registrada.');
    doc.text(`Coordenadas: Lat ${alarm.lat || 'N/A'}, Lng ${alarm.lng || 'N/A'}`);
    doc.moveDown(2);

    // --- PIE DE PÁGINA ---
    doc.fontSize(10).font('Helvetica-Oblique').text('Este es un documento autogenerado por el Sistema de Gestión de Alarmas.', {
        align: 'center',
        lineGap: 10
    });

    doc.end();
}