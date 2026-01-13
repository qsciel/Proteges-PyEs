-- Crear tabla para el estado del sistema
CREATE TABLE IF NOT EXISTS system_state (
    id INTEGER PRIMARY KEY,
    emergency_active BOOLEAN DEFAULT FALSE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar estado inicial si no existe
INSERT OR IGNORE INTO system_state (id, emergency_active) VALUES (1, FALSE);

-- Crear tabla para el historial de emergencias
CREATE TABLE IF NOT EXISTS emergency_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL, -- 'ACTIVATED' or 'DEACTIVATED'
    triggered_by INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_students INTEGER DEFAULT 0,
    scanned_students INTEGER DEFAULT 0,
    missing_students INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY(triggered_by) REFERENCES usuarios(id_usuario)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_emergency_history_timestamp ON emergency_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_emergency_history_action ON emergency_history(action);
CREATE INDEX IF NOT EXISTS idx_emergency_history_user ON emergency_history(triggered_by);
