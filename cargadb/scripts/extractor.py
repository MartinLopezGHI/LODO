import os
import io
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Configuración de Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH_SUCIOS = os.path.join(BASE_DIR, 'data', '1_sucios')
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'config', 'service_account.json')

# Nombre que el transformer.py buscará
NOMBRE_ESTATICO = "dataset_para_limpiar.xlsx"
DRIVE_FOLDER_ID = "1yqGbYsyTA2lfCSgk49J5lTwvHGpX1vKe"

def get_drive_service():
    """Establece conexión con la API de Google Drive."""
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, 
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )
        return build('drive', 'v3', credentials=creds)
    except Exception as e:
        logging.error(f"Error al autenticar con Google: {e}")
        raise

def extraer_startup_data():
    if not os.path.exists(PATH_SUCIOS):
        os.makedirs(PATH_SUCIOS)

    service = get_drive_service()

    # Búsqueda mejorada: Solo archivos que sean Sheets o Excel
    query = (f"'{DRIVE_FOLDER_ID}' in parents and trashed = false and "
             "(mimeType = 'application/vnd.google-apps.spreadsheet' or "
             "mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')")
    
    results = service.files().list(
        q=query, 
        fields="files(id, name, mimeType)",
        orderBy="modifiedTime desc" # Traemos el más recientemente modificado primero
    ).execute()
    
    items = results.get('files', [])

    if not items:
        logging.warning("No se encontraron archivos de Excel o Google Sheets en la carpeta especificada.")
        return

    # Seleccionamos el archivo más reciente que cumple el filtro
    item = items[0]
    file_id = item['id']
    mime_type = item['mimeType']
    
    logging.info(f"Archivo detectado: {item['name']}")
    file_path = os.path.join(PATH_SUCIOS, NOMBRE_ESTATICO)

    # Preparar descarga o exportación
    if mime_type == 'application/vnd.google-apps.spreadsheet':
        request = service.files().export_media(
            fileId=file_id, 
            mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    else:
        request = service.files().get_media(fileId=file_id)

    # Ejecución de la descarga
    try:
        with io.FileIO(file_path, 'wb') as fh:
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    logging.info(f"Progreso de descarga: {int(status.progress() * 100)}%")
        
        logging.info(f"Extracción completada. Archivo guardado en: {file_path}")
    except Exception as e:
        logging.error(f"Error durante la descarga: {e}")
        raise

if __name__ == "__main__":
    extraer_startup_data()