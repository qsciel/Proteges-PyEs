use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Serialize;
use sqlx::FromRow;

use crate::state::AppState;

#[derive(Debug, Serialize, FromRow)]
pub struct StudentBasicInfo {
    pub id_control_escolar: String,
    pub nombres: String,
    pub apellido_paterno: String,
    pub apellido_materno: Option<String>,
    pub grupo: String,
    pub especialidad: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct StudentAttendanceRecord {
    pub id_asistencia: i64,
    pub fecha_asistencia: String,
    pub presente: bool,
    pub salon_clase: String,
}

#[derive(Debug, Serialize)]
pub struct EmergencyStatusInfo {
    pub scanned: bool,
}

#[derive(Debug, Serialize)]
pub struct StudentPortalInfo {
    pub student: StudentBasicInfo,
    pub attendance: Vec<StudentAttendanceRecord>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emergency_status: Option<EmergencyStatusInfo>,
}

pub async fn get_student_portal_info(
    Path(student_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<StudentPortalInfo>, (StatusCode, Json<serde_json::Value>)> {
    // Get student basic info
    let student = sqlx::query_as::<_, StudentBasicInfo>(
        r#"
        SELECT 
            id_control_escolar,
            nombres,
            apellido_paterno,
            apellido_materno,
            grupo,
            especialidad
        FROM estudiantes
        WHERE id_control_escolar = ?
        "#,
    )
    .bind(&student_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("Error fetching student: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Error al buscar estudiante"})),
        )
    })?
    .ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Estudiante no encontrado"})),
        )
    })?;

    // Get attendance history (last 30 days)
    let attendance = sqlx::query_as::<_, StudentAttendanceRecord>(
        r#"
        SELECT 
            id_asistencia,
            fecha_asistencia,
            presente,
            salon_clase
        FROM asistencias
        WHERE id_control_escolar = ?
        AND datetime(fecha_asistencia) >= datetime('now', '-30 days')
        ORDER BY fecha_asistencia DESC
        LIMIT 30
        "#,
    )
    .bind(&student_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_else(|e| {
        eprintln!("Error fetching attendance (returning empty): {:?}", e);
        Vec::new()
    });

    // Check if emergency is active
    let emergency_active = *state.emergency_active.read().await;
    let emergency_status = if emergency_active {
        // Check if student is scanned
        let scanned = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM historial_consulta
            WHERE estudiante_consultado = ?
            "#,
        )
        .bind(&student_id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(0);

        Some(EmergencyStatusInfo {
            scanned: scanned > 0,
        })
    } else {
        None
    };

    Ok(Json(StudentPortalInfo {
        student,
        attendance,
        emergency_status,
    }))
}
