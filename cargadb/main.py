import subprocess
import sys
import os
import logging

# Configuración de Logging para trazabilidad profesional
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def check_environment():
    """Verifica que los archivos esenciales existan antes de empezar."""
    required_files = [
        os.path.join(BASE_DIR, "config", "service_account.json"),
        os.path.join(BASE_DIR, ".env")
    ]
    for file in required_files:
        if not os.path.exists(file):
            logging.error(f"Archivo crítico no encontrado: {file}")
            sys.exit(1)

def setup_virtual_environment():
    """Verifica y configura un entorno virtual asegurándose de instalar las dependencias."""
    venv_dir = os.path.join(BASE_DIR, ".venv")
    requirements_file = os.path.join(BASE_DIR, "requirements.txt")
    
    # Check if python is in Windows or Unix path inside the venv
    if os.name == 'nt':
        python_bin = os.path.join(venv_dir, "Scripts", "python.exe")
        pip_bin = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        python_bin = os.path.join(venv_dir, "bin", "python")
        pip_bin = os.path.join(venv_dir, "bin", "pip")

    if not os.path.exists(venv_dir):
        logging.info("Entorno virtual no encontrado. Creando entorno virtual '.venv'...")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True, cwd=BASE_DIR)
        
        logging.info("Instalando dependencias desde requirements.txt...")
        subprocess.run([pip_bin, "install", "-r", requirements_file], check=True, cwd=BASE_DIR)
        logging.info("Entorno virtual configurado exitosamente.")
    else:
        logging.info("Entorno virtual '.venv' detectado.")

    return python_bin

def run_step(python_bin, script_name):
    """Ejecuta un script de la carpeta scripts y maneja errores usando el binario de Python especificado."""
    path = os.path.join(BASE_DIR, "scripts", script_name)
    logging.info(f"Iniciando fase: {script_name}")
    
    if not os.path.exists(path):
        logging.error(f"No se encontró el script: {path}")
        sys.exit(1)
        
    try:
        # Usamos el python_bin del entorno virtual
        result = subprocess.run([python_bin, path], check=True, cwd=BASE_DIR)
        logging.info(f"Fase {script_name} completada con éxito.\n")
    except subprocess.CalledProcessError:
        logging.error(f"Falla crítica en la fase: {script_name}. Abortando.")
        sys.exit(1)

def main():
    logging.info("=== SISTEMA DE CARGA MASIVA DE STARTUPS INICIADO ===")
    
    # 1. Validación de entorno
    check_environment()
    
    # 2. Configuración de Entorno Virtual
    python_bin = setup_virtual_environment()
    
    # 3. Extracción (Antiguo descargador)
    run_step(python_bin, "extractor.py")
    
    # 4. Transformación (Aquí llamaremos a tu lógica de limpieza)
    run_step(python_bin, "transformer.py")
    
    # 5. Carga (Antiguo migrador)
    run_step(python_bin, "loader.py")
    
    logging.info("=== PROCESO ETL FINALIZADO EXITOSAMENTE ===")

if __name__ == "__main__":
    main()