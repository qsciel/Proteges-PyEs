use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, FromRow)]
pub struct Alumno {
    pub id: String,
    pub nombre: String,
    pub apellido_paterno: String,
    pub apellido_materno: String,
    pub fecha_nacimiento: String,
    pub tipo_de_sangre: String,
    pub alergias: Option<String>,
    pub enfermedades_cronicas: Option<String>,
    pub numero_telefono: Option<String>,
    pub numero_tutor: Option<String>,
    pub grupo: Option<String>,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub role: String,
    pub color: Option<String>,
    pub nombre: String,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct Scan {
    pub id: i64,
    pub student_id: String,
    pub user_id: i64,
    pub timestamp: String,
    pub scan_type: String,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct Group {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct EmergencyEvent {
    pub id: i64,
    pub active: bool,
    pub start_time: String,
    pub end_time: Option<String>,
    pub triggered_by: i64,
}

#[derive(Deserialize)]
pub struct EmergencyTriggerRequest {
    pub active: bool,
    pub user_id: i64,
}

#[derive(Serialize)]
pub struct StatsResponse {
    pub total_students: i64,
    pub scans_today: i64,
    pub active_emergency: bool,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub role: String,
    pub color: Option<String>,
    pub nombre: String,
}

#[derive(Deserialize)]
pub struct ScanRequest {
    pub student_id: String,
    pub user_id: i64,
    pub scan_type: String,
}

#[derive(Deserialize)]
pub struct CreateGroupRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct StudentWithStatus {
    #[sqlx(flatten)]
    pub student: Alumno,
    pub scan_color: Option<String>,
    pub scan_teacher_name: Option<String>,
    pub scan_timestamp: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateStudentRequest {
    pub id: String,
    pub nombre: String,
    pub apellido_paterno: String,
    pub apellido_materno: String,
    pub fecha_nacimiento: String,
    pub tipo_de_sangre: String,
    pub alergias: Option<String>,
    pub enfermedades_cronicas: Option<String>,
    pub numero_telefono: Option<String>,
    pub numero_tutor: Option<String>,
    pub grupo: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateStudentGroupRequest {
    pub group: String,
}

#[derive(Deserialize)]
pub struct ToggleScanRequest {
    pub student_id: String,
    pub user_id: i64,
}

#[derive(Serialize, FromRow)]
pub struct ScanHistoryItem {
    pub id: i64,
    pub student_name: String,
    pub user_name: String,
    pub action: String,
    pub timestamp: String,
}
