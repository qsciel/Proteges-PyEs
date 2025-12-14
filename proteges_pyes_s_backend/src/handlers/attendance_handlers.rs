use crate::{
    models::attendance::{AttendanceRecord, CreateAttendanceRequest},
    state::AppState,
};
use axum::{extract::State, http::StatusCode, Json};
use chrono::Local;

pub async fn register_attendance(
    State(state): State<AppState>,
    Json(payload): Json<CreateAttendanceRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let now = Local::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO asistencias (id_control_escolar, registrado_por, fecha_asistencia, salon_clase, presente) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&payload.student_id)
    .bind(payload.user_id)
    .bind(now)
    .bind(&payload.classroom)
    .bind(payload.present)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
    })?;

    Ok(Json(
        serde_json::json!({"message": "Asistencia registrada"}),
    ))
}

pub async fn get_attendance_history(
    State(state): State<AppState>,
) -> Result<Json<Vec<AttendanceRecord>>, (StatusCode, Json<serde_json::Value>)> {
    let history = sqlx::query_as::<_, AttendanceRecord>(
        "SELECT * FROM asistencias ORDER BY fecha_asistencia DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
    })?;

    Ok(Json(history))
}
