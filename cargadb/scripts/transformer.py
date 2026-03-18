import os
import pandas as pd
import json
import logging
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

# Configuración de Logging profesional
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH_SUCIOS = os.path.join(BASE_DIR, 'data', '1_sucios', 'dataset_para_limpiar.xlsx')
PATH_LIMPIOS = os.path.join(BASE_DIR, 'data', '2_limpios', 'startups_limpias_final.csv')

# --- MAPEO DE TAXONOMÍAS ---
# Mapeo de verticales para asegurar compatibilidad con la DB
MAP_VERTICAL = {
    'agtech': 'agtech', 'agricultura': 'agtech', 'agri-tech': 'agtech',
    'biotecnología y bioinsumos': 'biotech_bioinputs', 'biotech': 'biotech_bioinputs',
    'foodtech': 'foodtech', 'alimentos': 'foodtech',
    'climatech': 'climatech', 'clima': 'climatech',
    'economía circular': 'circular_economy', 'circular': 'circular_economy'
}

# Inicialización del geocodificador (OpenStreetMap)
geolocator = Nominatim(user_agent="lodo_etl_transformer")

def clean_val(val):
    """Limpia valores de celdas y devuelve None si están vacíos o tienen ruido."""
    if pd.isna(val) or str(val).strip().lower() in ['s/d', 'n/d', 'nan', 'none', '', '0', 0]:
        return None
    return str(val).strip()

def get_coords(loc_obj):
    """Obtiene coordenadas buscando por Ciudad/Región/País."""
    query_parts = [loc_obj.get('city'), loc_obj.get('region'), loc_obj.get('country')]
    query = ", ".join([p for p in query_parts if p])
    
    if not query:
        return None, None

    try:
        location = geolocator.geocode(query, timeout=10)
        if location:
            return location.latitude, location.longitude
        
        # Reintento fallback: solo país si la ubicación específica no se encuentra
        if "country" in loc_obj:
            location = geolocator.geocode(loc_obj["country"], timeout=10)
            if location:
                return location.latitude, location.longitude
    except (GeocoderTimedOut, Exception) as e:
        logging.warning(f"Error geocodificando {query}: {e}")
    
    return None, None

def transformar_datos():
    logging.info("Iniciando fase de Transformación y Geocodificación...")
    
    if not os.path.exists(PATH_SUCIOS):
        logging.error(f"Error: No se encontró el archivo de origen en {PATH_SUCIOS}")
        return

    # 1. Cargar el Excel
    df = pd.read_excel(PATH_SUCIOS)
    processed_records = []

    for index, row in df.iterrows():
        name = clean_val(row.get('name'))
        if not name:
            continue

        # --- A. UBICACIÓN (JSON DINÁMICO) ---
        loc_data = {}
        pais = clean_val(row.get('país ¿dónde se encuentra su principal sede de operaciones?'))
        ciudad_region = clean_val(row.get('ciudad/región'))
        
        if pais: loc_data["country"] = pais
        if ciudad_region:
            parts = ciudad_region.split(',')
            loc_data["city"] = parts[0].strip()
            if len(parts) > 1:
                loc_data["region"] = parts[1].strip()

        # Obtener Lat/Lng internamente
        lat, lng = get_coords(loc_data)
        # Respetar política de uso de Nominatim (1 req/seg)
        time.sleep(1)

        # --- B. REDES SOCIALES (JSON DINÁMICO) ---
        sm_data = {}
        social_mapping = {
            "linkedin": row.get('LINKEDIN'),
            "instagram": row.get('INSTAGRAM'),
            "facebook": row.get('FACEBOOK'),
            "twitter": row.get('X (twitter)')
        }
        for platform, value in social_mapping.items():
            cleaned = clean_val(value)
            if cleaned:
                sm_data[platform] = cleaned

        # --- C. TAXONOMÍAS DINÁMICAS ---
        raw_vert = str(row.get('vertical', '')).lower().strip()
        vertical_tecnica = MAP_VERTICAL.get(raw_vert, 'otra')

        # Estadio Actual
        estadio_raw = clean_val(row.get('Estadío actual'))
        estadio_final = estadio_raw.lower().replace(" ", "_") if estadio_raw else None

        # Modelo de Negocio
        biz_model_raw = clean_val(row.get('Modelo de Negocio'))
        biz_model_final = biz_model_raw.lower() if biz_model_raw else None

        # Resultado / Outcome
        outcome_raw = clean_val(row.get('RESULTADO / OUTCOME ¿QUÉ PASÓ CON LA EMPRESA?'))
        outcome_final = outcome_raw.lower() if outcome_raw else None

        # --- D. CONSTRUCCIÓN DEL DICCIONARIO PARA EL CSV ---
        item = {
            "name": name,
            "website": clean_val(row.get('website')),
            "vertical": vertical_tecnica,
            "sub_vertical": clean_val(row.get('sub vertical')),
            "location": json.dumps(loc_data, ensure_ascii=False),
            "logo_url": clean_val(row.get('Logo')),
            "estadio_actual": estadio_final,
            "solucion": clean_val(row.get('Descripcion / solución')),
            "mail": clean_val(row.get('Mail')),
            "social_media": json.dumps(sm_data, ensure_ascii=False) if sm_data else None,
            "contact_phone": clean_val(row.get('Teléfono')),
            "founders": json.dumps([f.strip() for f in str(row.get('Founder/s')).split(',')] if pd.notna(row.get('Founder/s')) else []),
            "founded": int(row.get('Founded')) if pd.notna(row.get('Founded')) and str(row.get('Founded')).isdigit() else None,
            "organization_type": "startup",
            "outcome_status": outcome_final,
            "business_model": biz_model_final,
            "badges": json.dumps([]), # Se puede mapear de la columna 'DESTACADO'
            "notes": clean_val(row.get('IMPACTO /SOCIOAMBIENTAL')),
            "status": "PUBLISHED" if lat and lng else "IN_REVIEW",
            "lat": lat,
            "lng": lng
        }
        
        processed_records.append(item)
        logging.info(f"[{index}] Procesado: {name} (Coord: {lat}, {lng})")

    # 2. Exportación a CSV final
    if processed_records:
        df_final = pd.DataFrame(processed_records)
        os.makedirs(os.path.dirname(PATH_LIMPIOS), exist_ok=True)
        df_final.to_csv(PATH_LIMPIOS, index=False, sep=';', encoding='utf-8-sig')
        logging.info(f"Éxito: Se han exportado {len(df_final)} registros a {PATH_LIMPIOS}")
    else:
        logging.warning("No se procesaron registros. El CSV no fue generado.")

if __name__ == "__main__":
    transformar_datos()