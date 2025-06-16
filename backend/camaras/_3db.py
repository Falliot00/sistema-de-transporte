import pyodbc
from tqdm import tqdm
import traceback

from dotenv import load_dotenv
import os

load_dotenv()

connection = pyodbc.connect(
    f'DRIVER={{ODBC Driver 17 for SQL Server}};'
    f'SERVER={os.getenv("DB_SERVER")};'
    f'DATABASE={os.getenv("DB_NAME")};'
    f'UID={os.getenv("DB_USER")};'
    f'PWD={os.getenv("DB_PASSWORD")}'
)

def conectar_db():
    try:
        connection = pyodbc.connect(
            f'DRIVER={{ODBC Driver 17 for SQL Server}};'
            f'SERVER={os.getenv("DB_SERVER")};'
            f'DATABASE={os.getenv("DB_NAME")};'
            f'UID={os.getenv("DB_USER")};'
            f'PWD={os.getenv("DB_PASSWORD")}'
        )
        print("Conexión exitosa a SQL Server")
        return connection
    except pyodbc.Error as e:
        print(f"Error al conectar a SQL Server: {e}")
        return None



def insertar_df_en_db(df, tabla):

    TABLAS_A_LIMPIAR = []  # podés modificar esta lista libremente


    connection = conectar_db()
    if connection is None:
        return

    cursor = connection.cursor()
    print(tabla.lower())
    if tabla.lower() in TABLAS_A_LIMPIAR:
        try:
            print(f"🧹 Borrando registros existentes de la tabla '{tabla}'...")
            cursor.execute(f"DELETE FROM {tabla}")
            connection.commit()
        except Exception as e:
            print(f"❌ Error al borrar registros de '{tabla}': {e}")
            connection.rollback()


    columnas = [f"[{col}]" for col in df.columns]  # Escapamos nombres de columnas con []
    sql = f"INSERT INTO {tabla} ({', '.join(columnas)}) VALUES ({', '.join(['?'] * len(df.columns))})"

    print(f"Insertando registros en BBDD")
    for row in tqdm(df.itertuples(index=False), total=df.shape[0], desc="Insertando registros"):
        valores = tuple(row)
        
        try:    
            cursor.execute(sql, valores)
            connection.commit()
        except pyodbc.IntegrityError as e:
            # Código de error de clave duplicada
            if '2627' in str(e) or '2601' in str(e):  
                # print(f"⚠️ Registro duplicado, se omite: {valores}")
                continue
            else:
                print(f"❌ Error al insertar: {e}")
                connection.rollback()
        except Exception as e:
            print("❌ Error general al insertar:")
            print("Tipo de error:", type(e))
            print("Mensaje:", e)
            print("Traceback:")
            traceback.print_exc()
            connection.rollback()

    cursor.close()
    connection.close()


# ================= AGREGAR FUNCION PARA UPDATE ========================


def update_db_record(table_name: str,
                     update_fields: dict,
                     where_conditions: dict,
                     connection=None) -> bool:
    conn = None
    try:
        conn = conectar_db()
        if conn is None:
            print("❌ No se pudo conectar a la base de datos.")
            return False

        cursor = conn.cursor()

        set_clause = ', '.join([f"[{k}] = ?" for k in update_fields]) # Usar corchetes por si acaso
        set_values = list(update_fields.values())

        where_clause = ' AND '.join([f"[{k}] = ?" for k in where_conditions])
        where_values = list(where_conditions.values())

        sql = f"UPDATE [{table_name}] SET {set_clause} WHERE {where_clause}"
        values = set_values + where_values

        cursor.execute(sql, *values) # El asterisco es importante para desempacar los valores
        conn.commit()

        # Esta línea ahora funcionará sin problemas
        print(f"✅ {cursor.rowcount} registro(s) actualizado(s).")
        return True

    except Exception as e:
        # Y esta también
        print(f"❌ Error al actualizar la base de datos: {e}")
        if conn:
            conn.rollback()
        return False

    finally:
        if conn:
            conn.close()