import subprocess
import sys
import os

# Configuración de rutas dinámicas absoluta
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REQUIREMENTS_PATH = os.path.join(BASE_DIR, "requirements.txt")
SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "config", "service_account.json")

def verificar_configuracion():
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"Error: No se encontró el archivo de configuración en {SERVICE_ACCOUNT_PATH}")
        print("Asegúrate de colocar tu 'service_account.json' en la carpeta 'config'.")
        sys.exit(1)

def instalar_dependencias():
    print(f"Verificando dependencias desde: {REQUIREMENTS_PATH}")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", REQUIREMENTS_PATH])
        print("Dependencias verificadas.\n")
    except Exception as e:
        print(f"Error al instalar dependencias: {e}")
        sys.exit(1)

def ejecutar_script(carpeta, nombre_script):
    ruta_script = os.path.join(BASE_DIR, carpeta, nombre_script)
    print(f"--- Ejecutando Fase: {carpeta}/{nombre_script} ---")
    
    if not os.path.exists(ruta_script):
        print(f"Error: No se encontró el archivo en {ruta_script}")
        sys.exit(1)
        
    try:
        # Ejecutamos el script asegurando el CWD correcto
        subprocess.run([sys.executable, ruta_script], check=True, cwd=BASE_DIR)
    except subprocess.CalledProcessError as e:
        print(f"Error al ejecutar {nombre_script}: {e}")
        sys.exit(1)

def ejecutar_notebook():
    ruta_nb = os.path.join(BASE_DIR, "notebooks", "01_limpieza_datos.ipynb")
    # Generamos un nombre temporal para la ejecución
    ruta_ejecucion = os.path.join(BASE_DIR, "notebooks", "tmp_ejecucion.ipynb")
    print(f"--- Ejecutando Notebook: 01_limpieza_datos.ipynb ---")
    
    try:
        comando = [
            sys.executable, "-m", "jupyter", "nbconvert", 
            "--to", "notebook", 
            "--execute", ruta_nb,
            "--output", ruta_ejecucion,
            "--ExecutePreprocessor.timeout=600"
        ]
        subprocess.run(comando, check=True, cwd=BASE_DIR)
        print("Notebook ejecutado y procesado correctamente.\n")
        
        # Limpieza del archivo temporal generado por nbconvert
        # En Windows a veces el proceso tarda en soltar el archivo
        import time
        intentos = 3
        while intentos > 0:
            try:
                if os.path.exists(ruta_ejecucion):
                    os.remove(ruta_ejecucion)
                break
            except PermissionError:
                time.sleep(1)
                intentos -= 1
    except subprocess.CalledProcessError as e:
        print(f"Error al ejecutar el notebook: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("========================================")
    print("   INICIANDO ORQUESTADOR CARGADB ")
    print("========================================\n")
    
    # 0. Verificación inicial
    verificar_configuracion()
    
    # 1. Instalación de librerías
    instalar_dependencias()
    
    # 2. Fase 1: Descarga
    ejecutar_script("scripts", "00_descargador.py")
    
    # 3. Fase 2: Limpieza (Notebook)
    ejecutar_notebook()
    
    # 4. Fase 3: Migración
    ejecutar_script("scripts", "01_migrador_db.py")
    
    print("\n========================================")
    print("   PROCESO FINALIZADO EXITOSAMENTE ")
    print("========================================")
