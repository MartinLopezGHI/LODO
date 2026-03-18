import os
import pandas as pd
import json
import requests
import logging
import sys
from dotenv import load_dotenv

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Cargar variables de entorno
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

API_URL = os.getenv('API_URL', 'http://localhost:8080')
BULK_ENDPOINT = f"{API_URL}/organizations/bulk-sync"
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', 'secret123')
BATCH_SIZE = 100 

def clean_null(val):
    """Limpia nulos de Pandas y devuelve None (null en JSON)."""
    if pd.isna(val) or str(val).strip().lower() in ['nan', 'none', 'null', 's/d', 'n/a']:
        return None
    return str(val).strip()

def safe_json_load(val):
    """Carga strings JSON del CSV a objetos de Python."""
    cleaned = clean_null(val)
    if not cleaned:
        return None
    try:
        return json.loads(cleaned)
    except Exception as e:
        logging.warning(f"Error parseando JSON: {val[:50]}... Error: {e}")
        return None

def ejecutar_carga():
    ruta_archivo = os.path.join(BASE_DIR, 'data', '2_limpios', 'startups_limpias_final.csv')
    
    if not os.path.exists(ruta_archivo):
        logging.error(f"Archivo no encontrado: {ruta_archivo}")
        sys.exit(1)
    
    # Leemos el CSV
    df = pd.read_csv(ruta_archivo, sep=';', encoding='utf-8-sig')
    
    if df.empty:
        logging.warning("El CSV está vacío.")
        return

    payload_total = []

    for _, row in df.iterrows():
        # Tratamiento especial para el año (evitar floats como 2020.0)
        try:
            founded_raw = row.get('founded')
            founded_val = int(float(founded_raw)) if pd.notna(founded_raw) else None
        except:
            founded_val = None

        # Construcción del objeto compatible con Go (CamelCase)
        org = {
            "name": str(row.get('name')),
            "website": clean_null(row.get('website')),
            "vertical": str(row.get('vertical')),
            "subVertical": clean_null(row.get('sub_vertical')),
            "location": safe_json_load(row.get('location')) or {}, # Objeto vacío en vez de null
            "logoUrl": clean_null(row.get('logo_url')),
            "estadioActual": clean_null(row.get('estadio_actual')),
            "solucion": clean_null(row.get('solucion')),
            "mail": clean_null(row.get('mail')),
            "socialMedia": safe_json_load(row.get('social_media')) or {}, # Objeto vacío en vez de null
            "contactPhone": clean_null(row.get('contact_phone')),
            "founders": safe_json_load(row.get('founders')) or [],
            "founded": founded_val,
            "organizationType": "startup",
            "outcomeStatus": clean_null(row.get('outcome_status')),
            "businessModel": clean_null(row.get('business_model')),
            "badges": safe_json_load(row.get('badges')) or [],
            "notes": clean_null(row.get('notes')),
            "status": str(row.get('status', 'DRAFT')),
            "lat": float(row['lat']) if pd.notna(row.get('lat')) else 0.0,
            "lng": float(row['lng']) if pd.notna(row.get('lng')) else 0.0
        }
        payload_total.append(org)

    # --- MODO DEBUG: Mostrar el primer registro para detectar el error 400 ---
    if payload_total:
        logging.info("DEBUG: Inspeccionando la estructura del primer registro:")
        print(json.dumps(payload_total[0], indent=2, ensure_ascii=False))
    # ------------------------------------------------------------------------

    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }

    total_creados = 0
    total_actualizados = 0

    for i in range(0, len(payload_total), BATCH_SIZE):
        batch = payload_total[i:i + BATCH_SIZE]
        logging.info(f"Enviando lote {i//BATCH_SIZE + 1}...")
        
        try:
            resp = requests.post(BULK_ENDPOINT, json=batch, headers=headers, timeout=300)
            
            if resp.status_code == 200:
                res = resp.json()
                total_creados += res.get('created', 0)
                total_actualizados += res.get('updated', 0)
                logging.info(f"Lote OK. Creados: {res.get('created')}, Actualizados: {res.get('updated')}")
            else:
                logging.error(f"ERROR 400/500 en el lote: {resp.status_code}")
                logging.error(f"Respuesta del servidor: {resp.text}")
                
        except Exception as e:
            logging.error(f"Error de conexión: {e}")

    logging.info(f"Proceso finalizado. Creados: {total_creados}, Actualizados: {total_actualizados}")

if __name__ == "__main__":
    ejecutar_carga()