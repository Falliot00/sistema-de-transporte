"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// src/config/index.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Carga las variables del archivo .env
// Define y exporta la configuración de la aplicación
exports.config = {
    port: process.env.PORT || 3001,
    aws: {
        s3BucketName: process.env.AWS_S3_BUCKET_NAME || '',
        region: process.env.AWS_S3_REGION || 'us-east-1', // O tu región por defecto
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
};
