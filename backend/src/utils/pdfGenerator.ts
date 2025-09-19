// backend/src/utils/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import { Choferes, AlarmasHistorico, TypeAlarms, Dispositivos, Empresa, Anomalia } from '@prisma/client';
import {
    getLogo, addHeader, drawBox, addSectionTitle, addSubsectionTitle,
    addLabelValue, addSignatureSection, downloadImage, generateQRCodeBuffer,
    STYLES, COLORS, normalizeLineEndings
} from './pdfHelpers';
import { WritableStreamBuffer } from 'stream-buffers';

export type AlarmWithDetails = AlarmasHistorico & {
    chofer: (Choferes & { empresaInfo: Empresa | null }) | null;
    typeAlarm: TypeAlarms | null;
    deviceInfo: Dispositivos | null;
    empresaInfo: Empresa | null;
    anomaliaInfo: Anomalia | null;
};

export type DriverAlarmsData = {
    chofer: Choferes & { empresaInfo: Empresa | null };
    alarmas: (AlarmasHistorico & { 
        typeAlarm: TypeAlarms | null;
        deviceInfo: Dispositivos | null;
    })[];
};

/**
 * Función auxiliar para gestionar saltos de página automáticos.
 * Verifica si hay suficiente espacio para el contenido y añade una nueva página si es necesario.
 * @param doc El documento PDF.
 * @param requiredHeight La altura necesaria para el próximo bloque de contenido.
 */
function checkAndAddPage(doc: PDFKit.PDFDocument, requiredHeight: number) {
    const remainingSpace = doc.page.height - doc.y - doc.page.margins.bottom;
    if (requiredHeight > remainingSpace) {
        // Guardar el estado actual de la fuente
        const currentFont = (doc as any)._font?.name;
        const currentSize = (doc as any)._fontSize;
        const currentColor = (doc as any)._fillColor?.toString();
        
        doc.addPage();
        
        // Restaurar el estado de la fuente después de la nueva página
        if (currentFont) doc.font(currentFont);
        if (currentSize) doc.fontSize(currentSize);
        if (currentColor) doc.fillColor(currentColor);
    }
}

export async function generateAlarmReportPDF(
    alarm: AlarmWithDetails,
    stream: NodeJS.WritableStream,
    bufferMode = false,
    totalPagesOverride = 0
) {
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: false });
    doc.pipe(stream);
    // Ajuste manual para mostrar la hora local de Argentina (UTC-3)
    let fechaFormateada = 'No disponible';
    if (alarm.alarmTime) {
        const alarmDate = new Date(alarm.alarmTime);
        alarmDate.setHours(alarmDate.getHours());
        fechaFormateada = alarmDate.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'medium' });
    }

    const logoBuffer = await getLogo();
    let pageNumber = 1;
    doc.addPage();
    await addHeader(doc, pageNumber, logoBuffer, totalPagesOverride);
    doc.on('pageAdded', () => {
        // Guardar el estado actual de la fuente
        const currentFont = (doc as any)._font?.name;
        const currentSize = (doc as any)._fontSize;
        const currentColor = (doc as any)._fillColor?.toString();
        
        pageNumber++;
        addHeader(doc, pageNumber, logoBuffer, totalPagesOverride);
        doc.y = 130; // Posición Y inicial en páginas nuevas
        
        // Restaurar el estado de la fuente después del header
        if (currentFont) doc.font(currentFont);
        if (currentSize) doc.fontSize(currentSize);
        if (currentColor) doc.fillColor(currentColor);
    });

    doc.y = 130; // Posición Y inicial en la primera página

    // === Sección 1: Información General ===
    addSectionTitle(doc, '1. Información General');

    // --- 1.1 Información del conductor (Dinámico) ---
    addSubsectionTitle(doc, '1.1 Información del conductor');
    let conductorContentHeight = 10;
    if (alarm.chofer) {
        doc.font(STYLES.value.font).fontSize(STYLES.value.fontSize);
        conductorContentHeight += doc.heightOfString(alarm.chofer.apellido_nombre || 'No disponible', { width: 335 }) + 5;
        conductorContentHeight += doc.heightOfString(alarm.chofer.dni || 'No disponible', { width: 335 }) + 5;
        conductorContentHeight += doc.heightOfString(alarm.chofer.anios?.toString() || 'No disponible', { width: 335 }) + 5;
        conductorContentHeight += doc.heightOfString(alarm.chofer.empresaInfo?.nombreMin || 'No disponible', { width: 335 }) + 5;
    } else {
        conductorContentHeight += doc.heightOfString('Chofer no asignado.', { width: 455 }) + 10;
    }
    const conductorBoxHeight = conductorContentHeight + 10;
    checkAndAddPage(doc, conductorBoxHeight + 20);
    const conductorBoxStartY = doc.y;
    doc.y = conductorBoxStartY;
    if (alarm.chofer) {
        addLabelValue(doc, 'Nombre:', alarm.chofer.apellido_nombre || 'No disponible', 90);
        addLabelValue(doc, 'DNI:', alarm.chofer.dni || 'No disponible', 90);
        addLabelValue(doc, 'Legajo:', alarm.chofer.anios?.toString() || 'No disponible', 90);
        addLabelValue(doc, 'Empresa:', alarm.chofer.empresaInfo?.nombreMin || 'No disponible', 90);
    } else {
        doc.font(STYLES.value.font).fontSize(STYLES.value.fontSize).fillColor(STYLES.value.color).text('Chofer no asignado.', 90);
    }
    doc.moveDown(1);

    // --- 1.2 Información del vehículo (Dinámico) ---
    addSubsectionTitle(doc, '1.2 Información del vehículo');
    let vehiculoContentHeight = 10;
    doc.font(STYLES.value.font).fontSize(STYLES.value.fontSize);
    vehiculoContentHeight += doc.heightOfString(alarm.interno || 'N/A', { width: 335 }) + 5;
    vehiculoContentHeight += doc.heightOfString(alarm.deviceInfo?.patente || 'No disponible', { width: 335 }) + 5;
    vehiculoContentHeight += doc.heightOfString(alarm.dispositivo?.toString() || 'N/A', { width: 335 }) + 5;
    const vehiculoBoxHeight = vehiculoContentHeight + 10;
    checkAndAddPage(doc, vehiculoBoxHeight + 20);
    const vehiculoBoxStartY = doc.y;
    doc.y = vehiculoBoxStartY;
    addLabelValue(doc, 'Interno:', alarm.interno || 'N/A', 90);
    addLabelValue(doc, 'Patente:', alarm.deviceInfo?.patente || 'No disponible', 90);
    addLabelValue(doc, 'Dispositivo ID:', alarm.dispositivo?.toString() || 'N/A', 90);
    doc.moveDown(1);

    // --- 1.3 Detalles del evento (Dinámico) ---
    addSubsectionTitle(doc, '1.3 Detalles del evento');
    const eventoBoxStartY = doc.y;
    let eventoContentHeight = 10;
    doc.font(STYLES.value.font).fontSize(STYLES.value.fontSize);
    eventoContentHeight += doc.heightOfString(alarm.guid, { width: 335 }) + 5;
    eventoContentHeight += doc.heightOfString(fechaFormateada, { width: 335 }) + 5;
    eventoContentHeight += doc.heightOfString(alarm.typeAlarm?.alarm || 'Desconocido', { width: 335 }) + 5;
    eventoContentHeight += doc.heightOfString(alarm.estado || 'No definido', { width: 335 }) + 5;
    eventoContentHeight += doc.heightOfString(alarm.velocidad !== null ? `${alarm.velocidad} km/h` : 'N/A', { width: 335 }) + 5;
    const mapsUrl = alarm.lat && alarm.lng ? `https://maps.google.com/?q=${alarm.lat},${alarm.lng}` : null;
    if (mapsUrl) {
        doc.fontSize(9);
        eventoContentHeight += doc.heightOfString(mapsUrl, { width: 240 }) + 5;
    } else {
        eventoContentHeight += doc.heightOfString('Coordenadas no disponibles', { width: 335 }) + 5;
    }
    const eventoBoxHeight = Math.max(100, eventoContentHeight + 10);
    checkAndAddPage(doc, eventoBoxHeight + 30);
    doc.y = eventoBoxStartY;
    addLabelValue(doc, 'ID de Alarma:', alarm.guid, 90);
    addLabelValue(doc, 'Fecha y Hora:', fechaFormateada, 90);
    addLabelValue(doc, 'Tipo de alarma:', alarm.typeAlarm?.alarm || 'Desconocido', 90);
    addLabelValue(doc, 'Estado Actual:', alarm.estado || 'No definido', 90);
    addLabelValue(doc, 'Velocidad registrada:', alarm.velocidad !== null ? `${alarm.velocidad} km/h` : 'N/A', 90);

    if (mapsUrl) {
        const qrBuffer = await generateQRCodeBuffer(mapsUrl);
        if (qrBuffer.length > 0) {
            doc.image(qrBuffer, 455, eventoBoxStartY + 40, { width: 62.5, height: 62.5 });
        }
        const currentY = doc.y;
        doc.fontSize(STYLES.label.fontSize).font(STYLES.label.font).fillColor(STYLES.label.color).text('Ubicación:', 90, currentY);
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.primary).text(mapsUrl, 210, currentY, { link: mapsUrl, underline: true, width: 240 });
    } else {
        addLabelValue(doc, 'Ubicación:', 'Coordenadas no disponibles', 90);
    }
    doc.moveDown(2);
    
    // === Sección 2: Análisis del desvío ===
    checkAndAddPage(doc, 50);
    addSectionTitle(doc, '2. Análisis del desvío');

    // 2.1 Detalles del control - Sin recuadro, texto fluido
    addSubsectionTitle(doc, '2.1 Detalles del control');
    const descText = alarm.descripcion 
        ? normalizeLineEndings(alarm.descripcion)
        : 'Esta alarma no tiene una descripción adicional.';
    doc.x = 70;
    doc.font(STYLES.value.font)
        .fontSize(STYLES.value.fontSize)
        .fillColor(STYLES.value.color)
        .text(descText, 70, doc.y, { 
            width: 475,
            align: 'justify',
            lineGap: 2
        });
    doc.moveDown(1);

    // 2.2 Comentarios del desvío registrado - Sin recuadro, texto fluido
    addSubsectionTitle(doc, '2.2 Comentarios del desvío registrado');
    
    if (alarm.anomaliaInfo) {
        const anomaliaTitle = alarm.anomaliaInfo.nomAnomalia || 'Anomalía sin nombre';
        const anomaliaDesc = normalizeLineEndings(alarm.anomaliaInfo.descAnomalia || 'Sin descripción adicional para esta anomalía.');
        
        // Título de la anomalía
        doc.x = 70;
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor(STYLES.value.color)
            .text(anomaliaTitle, 70, doc.y, { width: 475 });
        doc.moveDown(0.5);
        
        // Descripción de la anomalía - permitir que fluya entre páginas
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor(STYLES.value.color)
            .text(anomaliaDesc, 70, doc.y, { 
                width: 475,
                align: 'justify',
                lineGap: 2
            });
    } else {
        doc.x = 70;
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#999999')
            .text('Anomalía no tipificada.', 70, doc.y, { width: 475 });
        doc.moveDown(0.5);
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#999999')
            .text('No se ha asignado una anomalía específica a este evento.', 70, doc.y, { 
                width: 475,
                align: 'justify'
            });
    }
    doc.moveDown(2);
    
    // === Sección 3: Multimedia y Firmas ===
    checkAndAddPage(doc, 50);
    addSectionTitle(doc, '3. Registro multimedia');

    addSubsectionTitle(doc, '3.1 Imagen');
    const imageHeight = 260;
    checkAndAddPage(doc, imageHeight);
    if (alarm.imagen) {
        const imageBuffer = await downloadImage(alarm.imagen);
        if (imageBuffer) {
            doc.image(imageBuffer, 85, doc.y, { fit: [425, 300], align: 'center' });
            doc.y += imageHeight;
        }
    } else {
        doc.fontSize(10).font('Helvetica').fillColor('#999999').text('No hay imagen disponible para este evento.', 90);
        doc.moveDown(2);
    }

    addSubsectionTitle(doc, '3.2 Video');
    const videoText = alarm.video ? normalizeLineEndings(alarm.video) : 'No hay video disponible para este evento.';
    doc.font('Helvetica').fontSize(10);
    const videoHeight = doc.heightOfString(videoText, { width: 455 }) + 15;
    const videoBoxHeight = videoHeight + 20;
    checkAndAddPage(doc, videoBoxHeight);
    const videoBoxStartY = doc.y;
    doc.y = videoBoxStartY;
    doc.x = 90;
    if (alarm.video) {
        doc.fontSize(10).font(STYLES.label.font).fillColor(STYLES.label.color).text('Enlace al video: ', { continued: true });
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.primary).text(' ' + videoText, { link: alarm.video, underline: true });
    } else {
        doc.fontSize(10).font('Helvetica').fillColor('#999999').text('No hay video disponible para este evento.', { width: 455 });
    }
    doc.moveDown(2);

    // Firmas
    const signatureHeight = 0;
    checkAndAddPage(doc, signatureHeight);
    doc.y = doc.page.height - 150;
    addSignatureSection(doc);
    
    doc.end();
}

/**
 * Genera un PDF consolidado con múltiples alarmas de un chofer
 * @param data Datos del chofer y sus alarmas
 * @returns Buffer del PDF generado
 */
export async function generateDriverAlarmsSummaryPDF(data: DriverAlarmsData): Promise<Buffer> {
    console.log('[DEBUG PDF] Starting PDF generation with data:', {
        choferName: data.chofer.apellido_nombre,
        choferId: data.chofer.choferes_id,
        alarmsCount: data.alarmas.length
    });

    try {
        const streamBuffer = new WritableStreamBuffer();
        const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: false });
        
        doc.pipe(streamBuffer);

        console.log('[DEBUG PDF] Getting logo...');
        const logoBuffer = await getLogo();
        let pageNumber = 1;
        
        // Primera página
        doc.addPage();
        await addHeader(doc, pageNumber, logoBuffer, 0);
        
        doc.on('pageAdded', () => {
            const currentFont = (doc as any)._font?.name;
            const currentSize = (doc as any)._fontSize;
            const currentColor = (doc as any)._fillColor?.toString();
            
            pageNumber++;
            addHeader(doc, pageNumber, logoBuffer, 0);
            doc.y = 130;
            
            if (currentFont) doc.font(currentFont);
            if (currentSize) doc.fontSize(currentSize);
            if (currentColor) doc.fillColor(currentColor);
        });

        doc.y = 130;

        console.log('[DEBUG PDF] Adding title and chofer info...');
        // === Título del Informe ===
        doc.font(STYLES.sectionTitle.font)
           .fontSize(16)
           .fillColor(STYLES.sectionTitle.color)
           .text('INFORME CONSOLIDADO DE ALARMAS', 50, doc.y, { align: 'center' });
        doc.moveDown(2);

        // === Información del Chofer ===
        addSectionTitle(doc, '1. Información del Conductor');
        
        const choferInfo = data.chofer;
        addLabelValue(doc, 'Nombre:', choferInfo.apellido_nombre || 'No disponible', 90);
        addLabelValue(doc, 'DNI:', choferInfo.dni || 'No disponible', 90);
        addLabelValue(doc, 'Legajo:', choferInfo.anios?.toString() || 'No disponible', 90);
        addLabelValue(doc, 'Empresa:', choferInfo.empresaInfo?.nombreMin || 'No disponible', 90);
        doc.moveDown(1.5);

        console.log('[DEBUG PDF] Adding alarms summary and table...');
        // === Resumen de Alarmas ===
        addSectionTitle(doc, '2. Resumen de Alarmas');
        
        const fechaInforme = new Date().toLocaleDateString('es-AR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
        
        addLabelValue(doc, 'Fecha del informe:', fechaInforme, 90);
        addLabelValue(doc, 'Total de alarmas:', data.alarmas.length.toString(), 90);
        doc.moveDown(1.5);

        // === Tabla de Alarmas ===
        addSectionTitle(doc, '3. Detalle de Alarmas');
        doc.moveDown(0.5);

        // Encabezados de la tabla
        const tableTop = doc.y;
        const colWidths = {
            guid: 120,
            fecha: 120,
            tipo: 100,
            imagen: 80,
            video: 75
        };
        
        const startX = 50;
        let currentX = startX;

        // Dibuja encabezados
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');
        
        doc.text('GUID', currentX, tableTop, { width: colWidths.guid });
        currentX += colWidths.guid;
        
        doc.text('Fecha y Hora', currentX, tableTop, { width: colWidths.fecha });
        currentX += colWidths.fecha;
        
        doc.text('Tipo de Alarma', currentX, tableTop, { width: colWidths.tipo });
        currentX += colWidths.tipo;
        
        doc.text('Imagen', currentX, tableTop, { width: colWidths.imagen });
        currentX += colWidths.imagen;
        
        doc.text('Video', currentX, tableTop, { width: colWidths.video });

        // Línea debajo de encabezados
        doc.moveTo(startX, tableTop + 15)
           .lineTo(startX + Object.values(colWidths).reduce((a, b) => a + b, 0), tableTop + 15)
           .stroke();

        let currentY = tableTop + 25;
        doc.font('Helvetica').fontSize(8).fillColor('#000000');

        // Datos de las alarmas
        for (const alarma of data.alarmas) {
            // Verificar si necesitamos nueva página
            if (currentY > doc.page.height - 100) {
                doc.addPage();
                currentY = 150; // Reset Y position on new page
                
                // Redibujar encabezados en nueva página
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');
                currentX = startX;
                
                doc.text('GUID', currentX, currentY - 20, { width: colWidths.guid });
                currentX += colWidths.guid;
                doc.text('Fecha y Hora', currentX, currentY - 20, { width: colWidths.fecha });
                currentX += colWidths.fecha;
                doc.text('Tipo de Alarma', currentX, currentY - 20, { width: colWidths.tipo });
                currentX += colWidths.tipo;
                doc.text('Imagen', currentX, currentY - 20, { width: colWidths.imagen });
                currentX += colWidths.imagen;
                doc.text('Video', currentX, currentY - 20, { width: colWidths.video });
                
                doc.moveTo(startX, currentY - 5)
                   .lineTo(startX + Object.values(colWidths).reduce((a, b) => a + b, 0), currentY - 5)
                   .stroke();
                   
                doc.font('Helvetica').fontSize(8).fillColor('#000000');
            }

            currentX = startX;
            
            // GUID (truncado)
            const guidTruncated = alarma.guid.substring(0, 16) + '...';
            doc.text(guidTruncated, currentX, currentY, { width: colWidths.guid });
            currentX += colWidths.guid;
            
            // Fecha y hora
            const fechaAlarma = alarma.alarmTime 
                ? new Date(alarma.alarmTime).toLocaleString('es-AR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'N/A';
            doc.text(fechaAlarma, currentX, currentY, { width: colWidths.fecha });
            currentX += colWidths.fecha;
            
            // Tipo de alarma (truncado)
            const tipoAlarma = alarma.typeAlarm?.alarm || 'N/A';
            const tipoTruncated = tipoAlarma.length > 15 ? tipoAlarma.substring(0, 15) + '...' : tipoAlarma;
            doc.text(tipoTruncated, currentX, currentY, { width: colWidths.tipo });
            currentX += colWidths.tipo;
            
            // Link de imagen
            if (alarma.imagen) {
                const imagenUrl = alarma.imagen.length > 12 ? '🔗 Ver imagen' : alarma.imagen;
                doc.fillColor(COLORS.primary)
                   .text(imagenUrl, currentX, currentY, { 
                       width: colWidths.imagen, 
                       link: alarma.imagen,
                       underline: true 
                   })
                   .fillColor('#000000');
            } else {
                doc.text('N/A', currentX, currentY, { width: colWidths.imagen });
            }
            currentX += colWidths.imagen;
            
            // Link de video
            if (alarma.video) {
                const videoUrl = alarma.video.length > 10 ? '🔗 Ver video' : alarma.video;
                doc.fillColor(COLORS.primary)
                   .text(videoUrl, currentX, currentY, { 
                       width: colWidths.video, 
                       link: alarma.video,
                       underline: true 
                   })
                   .fillColor('#000000');
            } else {
                doc.text('N/A', currentX, currentY, { width: colWidths.video });
            }
            
            currentY += 20;
            
            // Línea separadora entre filas
            doc.moveTo(startX, currentY - 5)
               .lineTo(startX + Object.values(colWidths).reduce((a, b) => a + b, 0), currentY - 5)
               .strokeColor('#f0f0f0')
               .stroke()
               .strokeColor('#000000');
        }

        console.log('[DEBUG PDF] Adding signatures...');
        // Firmas al final
        doc.y = doc.page.height - 150;
        addSignatureSection(doc);
        
        doc.end();

        console.log('[DEBUG PDF] Waiting for PDF generation to complete...');
        return new Promise((resolve, reject) => {
            streamBuffer.on('finish', () => {
                const contents = streamBuffer.getContents();
                if (contents) {
                    console.log('[DEBUG PDF] PDF generation completed, buffer size:', contents.length);
                    resolve(contents as Buffer);
                } else {
                    console.error('[ERROR PDF] PDF buffer is empty');
                    reject(new Error('PDF buffer is empty'));
                }
            });
            streamBuffer.on('error', (error) => {
                console.error('[ERROR PDF] Stream buffer error:', error);
                reject(error);
            });
        });
    } catch (error) {
        console.error('[ERROR PDF] Error generating PDF:', error);
        throw error;
    }
}