import os
import subprocess

def convertir_grec_ffmpeg(nombre_archivo_grec, carpeta="./temp"):
    ruta_grec = os.path.join(carpeta, nombre_archivo_grec)
    
    if not os.path.exists(ruta_grec):
        print(f"❌ El archivo {ruta_grec} no existe.")
        return None

    nombre_base = os.path.splitext(nombre_archivo_grec)[0]
    ruta_h265 = os.path.join(carpeta, f"{nombre_base}.h265")
    ruta_mp4 = os.path.join(carpeta, f"{nombre_base}.mp4")

    # Renombrar a .h265
    os.rename(ruta_grec, ruta_h265)

    # Comando FFmpeg para convertir H.265 a H.264
    comando = [
        "ffmpeg",
        "-i", ruta_h265,
        "-c:v", "libx264",         # ⚠️ Convertir a H.264
        "-preset", "fast",         # ⚡ velocidad de codificación
        "-crf", "23",              # 🎚 calidad (18 mejor, 28 más compresión)
        ruta_mp4
    ]

    try:
        print(f"🚀 Ejecutando FFmpeg: {' '.join(comando)}")
        subprocess.run(comando, check=True)
        print(f"✅ Archivo convertido exitosamente a: {ruta_mp4}")
        return ruta_mp4
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al ejecutar FFmpeg: {e}")
        return None
    finally:
        if os.path.exists(ruta_h265):
            os.remove(ruta_h265)