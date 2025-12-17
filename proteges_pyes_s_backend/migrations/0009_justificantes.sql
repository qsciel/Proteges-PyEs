CREATE TABLE IF NOT EXISTS justificantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id TEXT NOT NULL,
    fecha_justificacion TEXT NOT NULL,  -- Fecha para la cual se pide el justificante (YYYY-MM-DD)
    motivo TEXT NOT NULL,
    evidencia_url TEXT,
    estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADO, RECHAZADO
    comentario_admin TEXT,
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(estudiante_id) REFERENCES estudiantes(id_control_escolar)
);
