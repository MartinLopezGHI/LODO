import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# --- CONFIGURACIÓN ESTATAL ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH_SUCIOS = os.path.join(BASE_DIR, 'data', '1_sucios')
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, 'config', 'service_account.json')

# Nombre ESTÁTICO que leerá el Notebook
NOMBRE_ESTATICO = "dataset_para_limpiar.xlsx"

# ID de la carpeta de Drive compartido
DRIVE_FOLDER_ID = "1yqGbYsyTA2lfCSgk49J5lTwvHGpX1vKe"

def descargar_y_estandarizar():
    # 1. Asegurar carpeta de destino
    if not os.path.exists(PATH_SUCIOS):
        os.makedirs(PATH_SUCIOS)

    # 2. Conexión con Google Drive
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, 
        scopes=['https://www.googleapis.com/auth/drive.readonly']
    )
    service = build('drive', 'v3', credentials=creds)

    # 3. Buscar archivos en la carpeta
    query = f"'{DRIVE_FOLDER_ID}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name, mimeType)").execute()
    items = results.get('files', [])

    if not items:
        print("No hay archivos en Drive.")
        return

    # 4. Tomar el archivo más reciente (o el primero que encuentre)
    item = items[0]
    file_id = item['id']
    file_name_original = item['name']
    mime_type = item['mimeType']

    print(f"Detectado en Drive: '{file_name_original}' (Tipo: {mime_type})")
    
    # Definir la ruta final con el nombre estático
    # Forzamos .xlsx porque el notebook está configurado para leer Excel
    file_path = os.path.join(PATH_SUCIOS, NOMBRE_ESTATICO)

    # 5. Configurar la descarga/exportación
    if mime_type == 'application/vnd.google-apps.spreadsheet':
        print("Exportando Google Sheet a formato Excel...")
        request = service.files().export_media(
            fileId=file_id, 
            mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    else:
        print("Descargando archivo binario...")
        request = service.files().get_media(fileId=file_id)

    # 6. Ejecutar descarga
    print(f"Guardando como: '{NOMBRE_ESTATICO}' en {PATH_SUCIOS}...")
    with io.FileIO(file_path, 'wb') as fh:
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            if status:
                print(f"Progreso: {int(status.progress() * 100)}%")
    
    print(f"\n>>> ¡Listo! Archivo disponible en: {file_path}")

if __name__ == "__main__":
    descargar_y_estandarizar()