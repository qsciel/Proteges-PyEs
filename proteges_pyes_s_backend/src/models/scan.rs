use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

// Request to register a scan
#[derive(Debug, Deserialize)]
pub struct RegisterScanRequest {
    pub student_id: String,
    pub user_id: i64,
    pub scan_type: String, // "entry", "exit", "emergency"
}

// Request to toggle scan status (safe/missing)
#[derive(Debug, Deserialize)]
pub struct ToggleScanRequest {
    pub student_id: String,
    pub user_id: i64,
}

// Scan history item
#[derive(Debug, Serialize, FromRow)]
pub struct ScanHistoryItem {
    #[sqlx(rename = "id_escaneo")]
    pub id: i64,
    #[sqlx(rename = "estudiante_consultado")]
    pub student_id: String,
    #[sqlx(default)]
    pub student_name: String,
    #[sqlx(rename = "consultado_por")]
    pub user_id: i64,
    #[sqlx(default)]
    pub user_name: String,
    #[sqlx(rename = "fecha_consulta")]
    pub scan_time: String,
}

// Emergency student with scan status
#[derive(Debug, Serialize)]
pub struct EmergencyStudent {
    pub id: String,
    pub names: String,
    pub paternal_last_name: String,
    pub maternal_last_name: String,
    pub group: String,
    pub major: String,
    pub scanned: bool,
    pub teacher_color: Option<String>,
}

// Emergency trigger request
#[derive(Debug, Deserialize)]
pub struct EmergencyTriggerRequest {
    pub active: bool,
    pub user_id: i64,
}

// Emergency status response
#[derive(Debug, Serialize)]
pub struct EmergencyStatus {
    pub active: bool,
}

// Update student group request
#[derive(Debug, Deserialize)]
pub struct UpdateStudentGroupRequest {
    pub group: String,
}
