// src/config/index.ts
import dotenv from 'dotenv';

dotenv.config(); // Carga las variables del archivo .env

// Define y exporta la configuración de la aplicación
export const config = {
  port: process.env.PORT || 3001,
  aws: {
    s3BucketName: process.env.AWS_S3_BUCKET_NAME || '',
    region: process.env.AWS_S3_REGION || 'us-east-1', // O tu región por defecto
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
};