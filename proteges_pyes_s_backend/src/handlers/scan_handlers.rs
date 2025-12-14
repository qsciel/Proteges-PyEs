use axum::{extract::State, http::StatusCode, Json};
use chrono::Utc;
use sqlx::{Pool, Sqlite};

use crate::models::scan::{RegisterScanRequest, ScanHistoryItem, ToggleScanRequest};

pub async fn register_scan(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<RegisterScanRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Verify student exists
    let student_exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM estudiantes WHERE id_control_escolar = ?)")
            .bind(&payload.student_id)
            .fetch_one(&pool)
            .await
            .unwrap_or(false);

    if !student_exists {
        return Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Estudiante no encontrado"})),
        ));
    }

    // Check if duplicate scan (already scanned today/session)
    // We check if this student has been scanned by ANYONE in the scanned history
    // For a cleaner 'session' based scan, we might want to date-limit this, but for now global check as per 'toggle' logic
    let already_scanned: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM historial_consulta WHERE estudiante_consultado = ?)",
    )
    .bind(&payload.student_id)
    .fetch_one(&pool)
    .await
    .unwrap_or(false);

    if already_scanned {
        return Err((
            StatusCode::CONFLICT,
            Json(serde_json::json!({"error": "El estudiante ya ha sido registrado"})),
        ));
    }

    // Insert scan record
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO historial_consulta (estudiante_consultado, consultado_por, fecha_consulta) VALUES (?, ?, ?)"
    )
    .bind(&payload.student_id)
    .bind(payload.user_id)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Error al registrar el escaneo"})),
        )
    })?;

    Ok(Json(serde_json::json!({
        "message": "Escaneo registrado correctamente",
        "student_id": payload.student_id,
        "scan_type": payload.scan_type,
    })))
}

pub async fn toggle_scan_status(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<ToggleScanRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Check if student has been scanned recently
    let now = Utc::now().to_rfc3339();
    let scanned: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM historial_consulta WHERE estudiante_consultado = ?)",
    )
    .bind(&payload.student_id)
    .fetch_one(&pool)
    .await
    .unwrap_or(false);

    if scanned {
        // Remove scan record (mark as missing)
        sqlx::query("DELETE FROM historial_consulta WHERE estudiante_consultado = ?")
            .bind(&payload.student_id)
            .execute(&pool)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Error al actualizar estado"})),
                )
            })?;

        Ok(Json(serde_json::json!({
            "message": "Estudiante marcado como faltante",
            "scanned": false
        })))
    } else {
        // Add scan record (mark as safe)
        sqlx::query(
            "INSERT INTO historial_consulta (estudiante_consultado, consultado_por, fecha_consulta) VALUES (?, ?, ?)"
        )
        .bind(&payload.student_id)
        .bind(payload.user_id)
        .bind(&now)
        .execute(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error al actualizar estado"})),
            )
        })?;

        Ok(Json(serde_json::json!({
            "message": "Estudiante marcado como a salvo",
            "scanned": true
        })))
    }
}

pub async fn get_scan_history(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<ScanHistoryItem>>, (StatusCode, Json<serde_json::Value>)> {
    let history = sqlx::query_as::<_, ScanHistoryItem>(
        "SELECT * FROM historial_consulta ORDER BY fecha_consulta DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Error al obtener historial"})),
        )
    })?;

    Ok(Json(history))
}
