-- Agregar índices para mejorar performance de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_estudiantes_grupo ON estudiantes(grupo);
CREATE INDEX IF NOT EXISTS idx_asistencias_estudiante ON asistencias(id_control_escolar);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha_asistencia);
CREATE INDEX IF NOT EXISTS idx_historial_estudiante ON historial_consulta(estudiante_consultado);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_consulta(fecha_consulta);
