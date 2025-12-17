use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, sqlx::FromRow)]
pub struct Justification {
    pub id: i64,
    pub estudiante_id: String,
    pub fecha_justificacion: String,
    pub motivo: String,
    pub evidencia_url: Option<String>,
    pub estado: String,
    pub fecha_solicitud: String,
}

#[derive(Serialize, Debug, sqlx::FromRow)]
pub struct CreateJustificationResponse {
    pub message: String,
    pub id: i64,
}

#[derive(Deserialize, Debug)]
pub struct UpdateJustificationStatusRequest {
    pub status: String, // APROBADO, RECHAZADO
    pub admin_comment: Option<String>,
}
