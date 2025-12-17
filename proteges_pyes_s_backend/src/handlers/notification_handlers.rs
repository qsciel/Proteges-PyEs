use crate::{
    models::notification::{NotificationResponse, RegisterTokenRequest},
    state::AppState,
};
use axum::{
    extract::{Json, State},
    http::StatusCode,
};

pub async fn register_device_token(
    State(state): State<AppState>,
    Json(payload): Json<RegisterTokenRequest>,
) -> Result<Json<NotificationResponse>, (StatusCode, Json<serde_json::Value>)> {
    let pool = &state.db;

    // Check if student exists
    let student_exists: Option<String> = sqlx::query_scalar(
        "SELECT id_control_escolar FROM estudiantes WHERE id_control_escolar = ?",
    )
    .bind(&payload.student_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    if student_exists.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Estudiante no encontrado" })),
        ));
    }

    // Insert or update token
    // We use a simple strategy: if the token exists for this student, update timestamp. If new, insert.
    // Actually simpler: just insert. Duplicate tokens for same student/device might be okay if different devices,
    // but we should probably avoid duplicate tokens.

    // Check if token already exists
    let token_exists: Option<i32> =
        sqlx::query_scalar("SELECT id FROM push_tokens WHERE token = ?")
            .bind(&payload.token)
            .fetch_optional(pool)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": e.to_string() })),
                )
            })?;

    if let Some(_) = token_exists {
        // Update student owner if changed? Or just ignore.
        // Let's update the student_id just in case the device changed hands (unlikely but possible)
        sqlx::query("UPDATE push_tokens SET student_id = ?, device_name = ? WHERE token = ?")
            .bind(&payload.student_id)
            .bind(&payload.device_name)
            .bind(&payload.token)
            .execute(pool)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": e.to_string() })),
                )
            })?;
    } else {
        sqlx::query("INSERT INTO push_tokens (student_id, token, device_name) VALUES (?, ?, ?)")
            .bind(&payload.student_id)
            .bind(&payload.token)
            .bind(&payload.device_name)
            .execute(pool)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": e.to_string() })),
                )
            })?;
    }

    Ok(Json(NotificationResponse {
        message: "Dispositivo registrado para notificaciones".to_string(),
    }))
}
