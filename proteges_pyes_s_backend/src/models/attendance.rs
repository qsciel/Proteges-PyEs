use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AttendanceRecord {
    pub id_asistencia: i64,
    pub id_control_escolar: String,
    pub registrado_por: i64,
    pub fecha_asistencia: String,
    pub salon_clase: String,
    pub presente: bool,
    pub justificacion: Option<String>,
    pub fecha_modificacion: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAttendanceRequest {
    pub student_id: String,
    pub user_id: i64,
    pub classroom: String,
    pub present: bool,
}
