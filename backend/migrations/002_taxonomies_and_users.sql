-- Tabla de Taxonomías (Diccionario del sistema)
CREATE TABLE IF NOT EXISTS taxonomies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(64) NOT NULL, -- 'vertical', 'estadioActual', 'organizationType', etc.
    value VARCHAR(128) NOT NULL,    -- El valor técnico (ej: 'agtech')
    label VARCHAR(128) NULL,        -- Lo que ve el usuario (ej: 'AgTech')
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_value (category, value),
    INDEX idx_category_active (category, is_active, sort_order)
);

-- Tabla de Usuarios (Para que el AuthHandler funcione)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Tabla de Auditoría (Para el auditRepo)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id CHAR(36),
    action VARCHAR(50),      -- 'CREATE', 'UPDATE', 'PUBLISH'
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    performed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear usuario administrador por defecto (Pass: admin123)
INSERT IGNORE INTO users (id, email, password_hash, name, role) VALUES 
('admin-001', 'admin@lodo.com', '$2a$10$K4QkkfyqVX0QJxayUdPUGeMEYut/z7yIjuSwAG4iBKIlfdaRR0nr2', 'Administrador', 'admin');