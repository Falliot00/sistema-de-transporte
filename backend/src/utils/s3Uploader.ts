// src/utils/s3Uploader.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export class S3Uploader {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.bucketName = config.aws.s3BucketName;
  }

  /**
   * Sube un archivo PDF a S3
   * @param pdfBuffer - Buffer del archivo PDF
   * @param fileName - Nombre del archivo (sin extensión)
   * @param choferId - ID del chofer para organizar en carpetas
   * @returns Promise con resultado de la operación
   */
  async uploadPDFReport(
    pdfBuffer: Buffer,
    fileName: string,
    choferId: number
  ): Promise<UploadResult> {
    try {
      const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const s3Key = `informes-chofer/${fecha}/${choferId}/${fileName}.pdf`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ACL: 'public-read',
        Metadata: {
          choferId: choferId.toString(),
          uploadDate: new Date().toISOString(),
          type: 'informe-alarmas'
        }
      });

      await this.s3Client.send(command);

      // Construir la URL pública del archivo
      const s3Url = `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;

      return {
        success: true,
        url: s3Url,
        key: s3Key,
      };
    } catch (error) {
      console.error('Error uploading PDF to S3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Instancia singleton para reutilizar
export const s3Uploader = new S3Uploader();