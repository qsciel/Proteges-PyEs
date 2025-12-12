CREATE TABLE IF NOT EXISTS asistencias (
    id_asistencia                    INTEGER PRIMARY KEY AUTOINCREMENT,
    id_control_escolar               TEXT NOT NULL,
    registrado_por                   INTEGER NOT NULL,
    fecha_asistencia                 DATE NOT NULL,
    salon_clase                      TEXT NOT NULL,
    presente                         BOOLEAN NOT NULL,
    justificacion                    TEXT,
    fecha_modificacion               DATE,
    FOREIGN KEY (id_control_escolar) REFERENCES estudiantes(id_control_escolar)
);