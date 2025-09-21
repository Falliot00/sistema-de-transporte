// backend/src/utils/pdfHelpers.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import QRCode from 'qrcode';

export const STYLES = {
    title: { fontSize: 16, font: 'Helvetica-Bold' },
    sectionTitle: { fontSize: 14, font: 'Helvetica-Bold', color: '#1a1a1a' },
    subsectionTitle: { fontSize: 12, font: 'Helvetica-Bold', color: '#333333' },
    // --- CAMBIO: Ajustamos el color de la etiqueta a un gris más oscuro ---
    label: { fontSize: 11, font: 'Helvetica-Bold', color: '#374151' }, // Un gris más oscuro y profesional
    value: { fontSize: 11, font: 'Helvetica', color: '#000000' }, // --- Aseguramos que el valor sea negro puro ---
    footer: { fontSize: 9, font: 'Helvetica', color: '#666666' },
    header: { fontSize: 14, font: 'Helvetica-Bold', color: '#000000' }
};

export const COLORS = {
    primary: '#2563eb',
    secondary: '#64748b',
    border: '#e5e7eb',
    background: '#f9fafb'
};

export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
    try {
        return await QRCode.toBuffer(text, { type: 'png', errorCorrectionLevel: 'H', width: 150 });
    } catch (error) {
        console.error('Error generando QR:', error);
        return Buffer.alloc(0);
    }
}

export async function getLogo(): Promise<Buffer | null> {
    try {
        // Ruta principal del logo
        const logoPath = path.join(__dirname, '..', '..', 'assets', 'LogosNegros.png');
        //console.log('Intentando cargar logo desde:', logoPath);
        //console.log('__dirname actual:', __dirname);
        
        if (fs.existsSync(logoPath)) {
            //console.log('Logo encontrado en ruta principal');
            return fs.readFileSync(logoPath);
        }

        // Rutas alternativas
        const alternatives = [
            'logosNegros.png',
            'logos_negros.png',
            'logo.png',
            'logo-grupo-alliot.png'
        ];

        for (const file of alternatives) {
            const altPath = path.join(__dirname, '..', '..', 'assets', file);
            //console.log('Intentando ruta alternativa:', altPath);
            if (fs.existsSync(altPath)) {
                //console.log('Logo encontrado en ruta alternativa:', altPath);
                return fs.readFileSync(altPath);
            }
        }

        // Ruta absoluta como último recurso
        const absoluteBackendPath = process.cwd();
        //console.log('Process.cwd():', absoluteBackendPath);
        
        const absoluteLogoPath = path.join(absoluteBackendPath, 'assets', 'LogosNegros.png');
        //console.log('Intentando ruta absoluta:', absoluteLogoPath);
        
        if (fs.existsSync(absoluteLogoPath)) {
            //console.log('Logo encontrado en ruta absoluta');
            return fs.readFileSync(absoluteLogoPath);
        }

        // Verificar si estamos en un subdirectorio y necesitamos ir al directorio backend
        if (absoluteBackendPath.includes('backend')) {
            const backendLogoPath = path.join(absoluteBackendPath, 'assets', 'LogosNegros.png');
            if (fs.existsSync(backendLogoPath)) {
                //console.log('Logo encontrado en directorio backend');
                return fs.readFileSync(backendLogoPath);
            }
        } else {
            const backendLogoPath = path.join(absoluteBackendPath, 'backend', 'assets', 'LogosNegros.png');
            if (fs.existsSync(backendLogoPath)) {
                //console.log('Logo encontrado en backend subdirectorio');
                return fs.readFileSync(backendLogoPath);
            }
        }

        console.warn('No se pudo encontrar el logo en ninguna ruta');
        return null;
    } catch (error) {
        console.error('Error al cargar el logo:', error);
        return null;
    }
}

export async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error descargando imagen:', error);
        return null;
    }
}

export function drawBox(doc: PDFKit.PDFDocument, box: { x: number; y: number; width: number; height: number }) {
    doc.rect(box.x, box.y, box.width, box.height)
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .stroke();

    doc.rect(box.x, box.y, box.width, box.height)
        .fillColor(COLORS.background)
        .fillOpacity(0.3)
        .fill()
        .fillOpacity(1);
}

export function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(STYLES.sectionTitle.fontSize)
        .font(STYLES.sectionTitle.font)
        .fillColor(STYLES.sectionTitle.color)
        .text(title, 50, doc.y);
    doc.moveDown(0.5);
}

export function addSubsectionTitle(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(STYLES.subsectionTitle.fontSize)
        .font(STYLES.subsectionTitle.font)
        .fillColor(STYLES.subsectionTitle.color)
        .text(title, 60, doc.y);
    doc.moveDown(0.3);
}

/**
 * Añade una fila de etiqueta y valor, manejando saltos de línea y calculando la altura total.
 * @param doc - La instancia del documento PDF.
 * @param label - El texto de la etiqueta.
 * @param value - El texto del valor.
 * @param x - La posición X inicial para la etiqueta.
 * @returns La altura total (en puntos) que ocupó la fila.
 */
export function addLabelValue(doc: PDFKit.PDFDocument, label: string, value: string, x: number): number {
    const startY = doc.y;
    const labelX = x;
    const valueX = x + 120;
    const valueWidth = 335;

    // Medir altura del valor, que es el que probablemente tendrá múltiples líneas
    const valueHeight = doc.heightOfString(value, { width: valueWidth });
    
    // Dibujar etiqueta
    doc.x = labelX;
    doc.y = startY; // Asegurarse de alinear verticalmente en la parte superior
    doc.fontSize(STYLES.label.fontSize)
        .font(STYLES.label.font)
        .fillColor(STYLES.label.color)
        .text(label);

    // Dibujar valor
    doc.x = valueX;
    doc.y = startY;
    doc.fontSize(STYLES.value.fontSize)
        .font(STYLES.value.font)
        .fillColor(STYLES.value.color)
        .text(value, { width: valueWidth, lineGap: 2 });
    
    // La altura total es la del valor (que es el más alto) + un pequeño margen inferior
    const totalHeight = valueHeight + 5;
    doc.y = startY + totalHeight; // Mover el cursor hacia abajo
    
    return totalHeight;
}

export function addHeader(doc: PDFKit.PDFDocument, pageNumber: number, logoBuffer: Buffer | null, totalPages: number = 0) {
    const headerY = 50;
    const headerHeight = 60;

    doc.rect(50, headerY, 495, headerHeight)
        .strokeColor('#000000')
        .lineWidth(1)
        .stroke();

    doc.moveTo(200, headerY).lineTo(200, headerY + headerHeight).stroke();
    doc.moveTo(395, headerY).lineTo(395, headerY + headerHeight).stroke();
    doc.moveTo(395, headerY + (headerHeight / 2)).lineTo(545, headerY + (headerHeight / 2)).stroke();

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
        .text('REG Informe anomalía', 60, headerY + 15, { width: 130, align: 'center' })
        .text('en conducción', 60, headerY + 30, { width: 130, align: 'center' });

    if (logoBuffer && logoBuffer.length > 0) {
        try {
            //console.log('Intentando insertar logo en PDF, tamaño del buffer:', logoBuffer.length);
            doc.image(logoBuffer, 220, headerY + 5, { fit: [155, 50], align: 'center', valign: 'center' });
            //console.log('Logo insertado exitosamente en PDF');
        } catch (err) {
            console.error('Error al insertar logo en PDF:', err);
            addCompanyText(doc, headerY);
        }
    } else {
        console.warn('No hay buffer de logo disponible, usando texto de empresa');
        addCompanyText(doc, headerY);
    }

    doc.fontSize(10).font('Helvetica').fillColor('#000000')
        .text('Revisión:', 405, headerY + 10, { width: 60, align: 'left' });
    doc.fontSize(14).font('Helvetica-Bold').text('0', 475, headerY + 8, { width: 60, align: 'center' });

    const pageText = totalPages > 0 ? `Página ${pageNumber} de ${totalPages}` : `Página ${pageNumber}`;
    doc.fontSize(10).font('Helvetica-Bold').text(pageText, 405, headerY + 35, { width: 80, align: 'left' });
}

export function addSignatureSection(doc: PDFKit.PDFDocument) {
    const signatureY = doc.y;
    const lineLength = 150;
    const lineY = signatureY + 60;

    doc.moveTo(100, lineY).lineTo(100 + lineLength, lineY).stroke();
    doc.moveTo(345, lineY).lineTo(345 + lineLength, lineY).stroke();

    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text('Firma y aclaración', 100, lineY + 10, { width: lineLength, align: 'center' });
    doc.text('ROSV', 100, lineY + 25, { width: lineLength, align: 'center' });
    doc.text('Firma y aclaración', 345, lineY + 10, { width: lineLength, align: 'center' });
    doc.text('Conductor', 345, lineY + 25, { width: lineLength, align: 'center' });
}

function addCompanyText(doc: PDFKit.PDFDocument, headerY: number) {
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#FF0000')
        .text('monte', 210, headerY + 15, { width: 55, align: 'right', continued: true })
        .fillColor('#000000').text('vera', { width: 50, align: 'left' });

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000')
        .text('laguna', 205, headerY + 35, { width: 70, align: 'right', continued: true })
        .text('paiva', { width: 50, align: 'left' });
}

export function normalizeLineEndings(text: string): string {
  return text
    .replace(/\r\n/g, '\n')   // Windows-style to Unix-style
    .replace(/\r/g, '\n')     // Old Mac-style
    .replace(/[^\x20-\x7E\náéíóúÁÉÍÓÚñÑüÜçÇ.,;:¡!¿?"'()]/g, '') // Remove weird non-ASCII symbols (optional)
    .trim();
}