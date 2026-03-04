import os
import pandas as pd
import uuid
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import json
import sys

# Configuracion de rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

def ejecutar_migracion():
    USUARIO = os.getenv('DB_USER')
    PASSWORD = os.getenv('DB_PASS')
    HOST = os.getenv('DB_HOST')
    PORT = os.getenv('DB_PORT')
    DATABASE = os.getenv('DB_NAME')
    
    ruta_archivo = os.path.join(BASE_DIR, 'data', '2_limpios', 'startups_limpias_final.csv')
    
    if not os.path.exists(ruta_archivo):
        raise FileNotFoundError(f"No se encontro el archivo en {ruta_archivo}")

    url_conexion = f"mysql+mysqlconnector://{USUARIO}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"
    engine = create_engine(url_conexion)
    df = pd.read_csv(ruta_archivo, sep=';', encoding='utf-8-sig')

    # --- AJUSTE: FORZAR S/D EN UBICACIONES ---
    columnas_ubicacion = ['country', 'region', 'city']

    def forzar_sd(val):
        s_val = str(val).strip().lower()
        # Si es nulo, esta vacio o ya dice s/d, devolvemos "S/D"
        if pd.isna(val) or s_val in ['nan', 'none', '', 's/d', 'null', 'unknown']:
            return "S/D"
        return str(val).strip()

    for col in columnas_ubicacion:
        if col in df.columns:
            df[col] = df[col].apply(forzar_sd)

    # --- LOGICA DE COLUMNAS JSON ---
    columnas_json = ['social_media', 'founders', 'badges']
    def to_json_safe(val):
        s_val = str(val).strip()
        if s_val.lower() in ['s/d', 'nan', 'none', '', 'null']:
            return '[]'
        try:
            if s_val.startswith(('[', '{')):
                json.loads(s_val)
                return s_val
            return json.dumps([s_val])
        except:
            return json.dumps([s_val])

    for col in columnas_json:
        if col in df.columns:
            df[col] = df[col].apply(to_json_safe)

    try:
        query_existentes = text("SELECT id, name FROM organizations")
        with engine.connect() as conn:
            existentes_df = pd.read_sql(query_existentes, conn)
        
        existentes_df['name_clean'] = existentes_df['name'].fillna('').str.lower().str.strip()
        dict_existentes = dict(zip(existentes_df['name_clean'], existentes_df['id']))
        
        campos_tecnicos = ['vertical', 'sub_vertical', 'estadio_actual', 'organization_type', 'outcome_status', 'business_model']

        with engine.begin() as conn:
            for i, row in df.iterrows():
                if pd.isna(row['name']) or str(row['name']).strip() == '':
                    continue

                nombre_clean = str(row['name']).lower().strip()
                prepared_row = row.to_dict()

                # Limpieza general de NaNs a None para el resto de columnas
                for c in prepared_row:
                    if pd.isna(prepared_row[c]) and c not in columnas_ubicacion:
                        prepared_row[c] = None
                    elif c in campos_tecnicos:
                        prepared_row[c] = str(prepared_row[c]).lower().strip()

                if nombre_clean in dict_existentes:
                    org_id = dict_existentes[nombre_clean]
                    updates = {}
                    for col in df.columns:
                        if col in prepared_row and col not in ['id', 'name', 'created_at', 'updated_at']:
                            updates[col] = prepared_row[col]
                    
                    if updates:
                        set_clause = ", ".join([f"{c} = :{c}" for c in updates.keys()])
                        sql_update = text(f"UPDATE organizations SET {set_clause} WHERE id = :id")
                        params = {**updates, "id": org_id}
                        conn.execute(sql_update, params)
                else:
                    prepared_row['id'] = str(uuid.uuid4())
                    pd.DataFrame([prepared_row]).to_sql('organizations', con=conn, if_exists='append', index=False)

        print(f"Migracion finalizada con S/D en ubicaciones.")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    ejecutar_migracion()