use crate::{models::justification::CreateJustificationResponse, state::AppState};
use axum::extract::multipart::Field;
use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    Json,
};
use std::path::Path;
use tokio::fs;
use tokio::io::AsyncWriteExt;

pub async fn submit_justification(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<CreateJustificationResponse>, (StatusCode, Json<serde_json::Value>)> {
    let mut student_id = String::new();
    let mut date = String::new();
    let mut reason = String::new();
    let mut evidence_path: Option<String> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();

        if name == "evidence" {
            let filename = field.file_name().unwrap_or("evidence.jpg").to_string();
            // We need to read the bytes. Axum 0.7/0.8 uses `bytes()` or stream.
            let data = match field.bytes().await {
                Ok(bytes) => bytes,
                Err(e) => {
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(
                            serde_json::json!({ "error": format!("Failed to read file bytes: {}", e) }),
                        ),
                    ))
                }
            };

            let timestamp = chrono::Local::now().timestamp();
            // Sanitize filename a bit
            let safe_filename = format!("{}_{}", timestamp, filename.replace(" ", "_"));
            let filepath = format!("uploads/{}", safe_filename);

            if let Err(e) = fs::write(&filepath, data).await {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": format!("Failed to save file: {}", e) })),
                ));
            }
            evidence_path = Some(filepath);
        } else {
            // For text fields
            let data = match field.text().await {
                Ok(text) => text,
                Err(e) => {
                    return Err((
                        StatusCode::BAD_REQUEST,
                        Json(serde_json::json!({ "error": e.to_string() })),
                    ))
                }
            };

            match name.as_str() {
                "student_id" => student_id = data,
                "date" => date = data,
                "reason" => reason = data,
                _ => {}
            }
        }
    }

    if student_id.is_empty() || date.is_empty() || reason.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                serde_json::json!({ "error": "Missing required fields (student_id, date, reason)" }),
            ),
        ));
    }

    let result = sqlx::query(
        "INSERT INTO justificantes (estudiante_id, fecha_justificacion, motivo, evidencia_url) VALUES (?, ?, ?, ?)"
    )
    .bind(&student_id)
    .bind(&date)
    .bind(&reason)
    .bind(&evidence_path)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
             Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    let id = result.last_insert_rowid();

    Ok(Json(CreateJustificationResponse {
        message: "Justificación enviada correctamente".to_string(),
        id,
    }))
}

pub async fn get_pending_justifications(
    State(state): State<AppState>,
) -> Result<
    Json<Vec<crate::models::justification::Justification>>,
    (StatusCode, Json<serde_json::Value>),
> {
    let justifications = sqlx::query_as::<_, crate::models::justification::Justification>(
        "SELECT * FROM justificantes WHERE estado = 'PENDIENTE' ORDER BY fecha_solicitud DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(justifications))
}

pub async fn update_justification_status(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<i64>,
    Json(payload): Json<crate::models::justification::UpdateJustificationStatusRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Validate status
    if payload.status != "APROBADO" && payload.status != "RECHAZADO" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Status must be APROBADO or RECHAZADO" })),
        ));
    }

    sqlx::query("UPDATE justificantes SET estado = ?, comentario_admin = ? WHERE id = ?")
        .bind(&payload.status)
        .bind(&payload.admin_comment)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    // Optional: Send notification to student (parent) about status change
    // We would need to fetch student_id first.
    // Simplifying for now.

    Ok(Json(serde_json::json!({
        "message": "Estado actualizado correctamente"
    })))
}
