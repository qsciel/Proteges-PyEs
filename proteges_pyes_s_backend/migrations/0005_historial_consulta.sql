CREATE TABLE IF NOT EXISTS historial_consulta (
    id_escaneo                          INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_consultado               TEXT NOT NULL,
    consultado_por                      INTEGER NOT NULL,
    fecha_consulta                      TIME NOT NULL,
    FOREIGN KEY(estudiante_consultado)  REFERENCES estudiantes(id_control_escolar),
    FOREIGN KEY(consultado_por)         REFERENCES usuarios(id_usuario)
);