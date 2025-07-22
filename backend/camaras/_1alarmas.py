from _0gps_camera_api import GPSCameraAPI
from datetime import datetime, timedelta
import pandas as pd
from _3db import insertar_df_en_db
import logging
from urllib.parse import urlparse, urlunparse
import requests
from dotenv import load_dotenv
import os

load_dotenv()

api_user = os.getenv("API_USER")
api_password = os.getenv("API_PASSWORD")
result = api.login(api_user, api_password)

bucket_name = os.getenv("AWS_BUCKET")
aws_access_key = os.getenv("AWS_ACCESS_KEY")
aws_secret_key = os.getenv("AWS_SECRET_KEY")
region = os.getenv("AWS_REGION")

# Configuración básica
api = GPSCameraAPI(
    base_url="http://190.183.254.253:8088",  # URL del servidor
    timeout=300,                              # Timeout en segundos
    verify_ssl=True,                          # Verificar certificados SSL
    proxies={
    "http": "http://127.0.0.1:1080", 
    "https": "http://127.0.0.1:1080"
}
)

# ======================= LOGGING ======================

logging.basicConfig(level=logging.INFO)

# Login con credenciales
result = api.login(api_user, api_password)

# Verificar si la sesión es válida
if api.is_session_valid():
    print("Sesión activa")
else:
    print("Necesita re-autenticarse")


# ============ Dispositivos ===================
vehicles = api.get_user_vehicles()

devices = []

for vehiculo in vehicles['vehicles']:
    for dispositivo in vehiculo['dl']:
        devices.append(dispositivo['id'])

print('Dispositivos obtenidos')
# ======================== Alarmas ===========================
#Seteo las alarmas que quiero evaluar, en lista para pasar todo junto
alarms=[404,460,619,624,626]

#Seteo el horario, como pide el url, con %20 en lugar del espacio
# Hora actual
now = datetime.now()

# Hora anterior
previous_hour = now - timedelta(hours=1)

# Formatos requeridos con %20 como separador entre fecha y hora
start_time = previous_hour.replace(minute=0, second=0, microsecond=0).strftime('%Y-%m-%d%%20%H:%M:%S')
end_time = previous_hour.replace(minute=59, second=59, microsecond=0).strftime('%Y-%m-%d%%20%H:%M:%S')

print('Seteo para alarmas realizado')
# --------- Genero una lista para almacenar todas las alarmas
all_alarms = []

print('Procesando alarmas')
response=api.get_device_alarms(
    start_time=start_time,
    end_time=end_time,
    device_ids=devices,
    alarm_types=alarms,    
    vehicle_ids=None,                   # Todos los vehículos
    handled=None,                       # Todas (manejadas y no manejadas)
    geo_address=True,
    map_type=2,    # Tipos de alarma específicos
    current_page=1,
    page_records=20000
)

print(response)
all_alarms.extend(response['alarms']) 

print('Alarmas procesadas')
# ----------- Transformo y dejo las claves que me interesasn
# Capaz tenga que dejar cn que es company name, o algun identificador, 
# para que al guardar las fotos sea mas facil dirigirlas a su bucket
alarm_data = api.prepare_alarm_data_for_evidence(all_alarms)



#Aca subo la imagen a S3

bucket_name = os.getenv("AWS_BUCKET")
aws_access_key = os.getenv("AWS_ACCESS_KEY")
aws_secret_key = os.getenv("AWS_SECRET_KEY")
region = os.getenv("AWS_REGION")

registros = []
print('Subiendo imagenes a S3')
for alarm in alarm_data:
    evidence = api.get_evidence_query(
        device_id=alarm['did'],
        guid=alarm['guid'],
        alarm_type=alarm['atp'],
        start_time=alarm['start_time']
    )

    images = evidence.get('images', [])
    if not images:
        continue


    download_url = images[0].get('downloadUrl')
    
    # parsed = urlparse(download_url)
    # download_url_local = urlunparse(parsed._replace(netloc="1270.0.0.1:6611"))

    # response = requests.get(download_url_local, timeout=10)

    if not download_url:
        continue

    # Subir imagen
    s3_url = api.upload_image_to_s3(
        download_url=download_url,
        evidence_data=evidence,
        start_time=alarm['start_time'],
        guid=alarm['guid'],
        bucket_name=bucket_name,
        aws_access_key=aws_access_key,
        aws_secret_key=aws_secret_key,
        region=region
    )

    infos = evidence.get('infos', [])
    cn = infos.get('cn')
    did = infos.get('did')

    empresa = 1 if cn == 'LagunaPaiva' else 2

    registros.append({
        'guid': alarm['guid'],
        'dispositivo': did,
        'idinterno': alarm['vid'],
        'alarmType': alarm['atp'],
        'velocidad': alarm['ssp'],
        'lng': alarm['lng'],
        'lat': alarm['lat'],
        'ubi': alarm['ubi'],
        'alarmTime': alarm['start_time'],
        'imagen': s3_url,
        'video': None,
        'estado': 'Pendiente',
        'idEmpresa': empresa
    })


print('Imagenes almacenadas en S3')


df_regisrtos = pd.DataFrame(registros)

insertar_df_en_db(df_regisrtos,'alarmas.alarmasHistorico')

#======== 28/05 14:27 FUNCIONA BIEN  ==========================