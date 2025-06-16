# backend/camaras/_2video.py

import sys
import io
import os
import time
import logging
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs, urlunparse
import requests
from dotenv import load_dotenv

# --- Configuración de Codificación y Logging ---
# Asegura que toda la salida del script sea UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Carga las variables de entorno desde el archivo .env
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Importación de Módulos Locales ---
from _0gps_camera_api import GPSCameraAPI, APIError
from _3db import update_db_record
from _4Convertidor import convertir_grec_ffmpeg

# --- Funciones Auxiliares ---

def obtener_argumentos():
    """Valida y obtiene los argumentos de la línea de comandos."""
    if len(sys.argv) != 4:
        logging.error("Uso: python _2video.py <dispositivo_id> <alarm_time_iso> <guid_alarma>")
        sys.exit(1)
    
    dispositivo_id, alarm_time_iso, guid_alarma = sys.argv[1], sys.argv[2], sys.argv[3]
    logging.info("Argumentos recibidos: Dispositivo=%s, FechaISO=%s, GUID=%s", dispositivo_id, alarm_time_iso, guid_alarma)
    return dispositivo_id, alarm_time_iso, guid_alarma

def sondear_descarga_servidor(api, file_entry, target_time):
    """Solicita la descarga al servidor y sondea hasta que esté lista."""
    tStart_str = (target_time - timedelta(seconds=10)).strftime('%Y-%m-%d%%20%H:%M:%S')
    tEnd_str = (target_time + timedelta(seconds=10)).strftime('%Y-%m-%d%%20%H:%M:%S')
    
    parsed = urlparse(file_entry['DownTaskUrl'])
    params = parse_qs(parsed.query)
    params.update({
        'fbtm': [tStart_str], 'fetm': [tEnd_str], 'len': ['50000000'],
        'chn': ['2'], 'dtp': ['2']
    })
    new_query = "&".join(f"{key}={value[0]}" for key, value in params.items())
    new_url = urlunparse(parsed._replace(query=new_query))

    max_reintentos, intentos, stu = 20, 0, None
    while stu != 4 and intentos < max_reintentos:
        try:
            logging.info(f"Intento {intentos + 1}/{max_reintentos} para solicitar descarga al servidor...")
            response = requests.get(new_url)
            result = response.json()
            stu = result.get('oldTaskAll', {}).get('stu')

            if result.get('result') == 0 and stu == 4:
                logging.info("✅ Tarea de descarga en servidor completada.")
                task_info = result['oldTaskAll']
                return task_info.get('did'), task_info.get('len'), task_info.get('dph')
            elif result.get('result') == 11 and stu == 4:
                logging.info("✅ Tarea de descarga ya existía y está completada.")
                task_info = result['oldTaskAll']
                return task_info.get('did'), task_info.get('len'), task_info.get('dph')
            else:
                logging.warning(f"Aún no está listo (stu={stu}), reintentando en 3 segundos...")
                time.sleep(3)
                intentos += 1
        except requests.RequestException as e:
            logging.error(f"Error de red al solicitar descarga: {e}")
            time.sleep(5)
            intentos += 1
            
    logging.error("No se pudo completar la tarea de descarga en el servidor tras múltiples intentos.")
    return None, None, None

def procesar_video_alarma(dispositivo_id: str, alarm_time_iso: str, guid_alarma: str):
    """Orquesta todo el proceso de descarga, conversión y subida del video."""
    api = GPSCameraAPI(base_url="http://190.183.254.253:8088", timeout=300)
    api.login(os.getenv("API_USER"), os.getenv("API_PASSWORD"))
    if not api.is_session_valid():
        logging.error("Fallo en la autenticación con la API de GPS/Cámaras.")
        return

    try:
        target_time = datetime.fromisoformat(alarm_time_iso.replace('Z', '+00:00'))
    except ValueError:
        logging.error(f"Formato de fecha inválido: {alarm_time_iso}")
        return

    try:
        logging.info("Buscando archivos de video en el dispositivo...")
        t = target_time
        start_secs = (t.hour * 3600 + t.minute * 60 + t.second) - 10
        end_secs = start_secs + 20

        video_info = api.query_video_files(
            device_id=dispositivo_id, location=1, channel=2,
            year=t.year, month=t.month, day=t.day,
            record_type=-1, file_type=2,
            start_seconds=start_secs, end_seconds=end_secs
        )

        if not video_info.get("files"):
            logging.warning(f"No se encontraron archivos de video para la alarma {guid_alarma}.")
            return

        did, leng, dph = sondear_descarga_servidor(api, video_info["files"][0], target_time)
        if not did:
            return

        descarga_local = api.descarga_video_local(archivo=guid_alarma, did=did, leng=leng, dph=dph)
        if not descarga_local.get('success'):
            logging.error(f"Fallo en la descarga local: {descarga_local.get('error')}")
            return

        ruta_mp4 = convertir_grec_ffmpeg(f"{guid_alarma}.grec")
        if not ruta_mp4:
            logging.error("Fallo en la conversión del video a MP4.")
            return

        resultado_s3 = api.upload_video_to_s3(
            did=did, video_path=ruta_mp4, start_time=alarm_time_iso, guid=guid_alarma,
            bucket_name=os.getenv("AWS_BUCKET_NAME"),
            aws_access_key=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region=os.getenv("AWS_REGION")
        )
        
        if not resultado_s3.get('success'):
            logging.error(f"Fallo al subir a S3: {resultado_s3.get('error')}")
            return
        
        logging.info(f"Video procesado y subido a S3: {resultado_s3['url']}")

        logging.info("Actualizando registro en la base de datos...")
        update_db_record(
            table_name='alarmasHistorico',
            update_fields={'video': resultado_s3['url']},
            where_conditions={'guid': guid_alarma}
        )

    except APIError as e:
        logging.error(f"Error de API al intentar procesar el video: {e}")
        return
    except Exception as e:
        logging.error(f"Error inesperado durante el procesamiento de video: {e}", exc_info=True)
        return

def main():
    try:
        dispositivo_id, alarm_time_iso, guid_alarma = obtener_argumentos()
        procesar_video_alarma(dispositivo_id, alarm_time_iso, guid_alarma)
        logging.info("Proceso finalizado para la alarma %s.", guid_alarma)
    except Exception as e:
        logging.error(f"Ocurrió un error fatal en el script: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()