use crate::{
    models::attendance::{AttendanceHistoryResponse, AttendanceRecord, CreateAttendanceRequest},
    state::AppState,
};
use axum::{extract::State, http::StatusCode, Json};
use chrono::Local;
use sqlx::Row;

pub async fn register_attendance(
    State(state): State<AppState>,
    Json(payload): Json<CreateAttendanceRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let now = Local::now().to_rfc3339();

    // Resolve the real Student ID (id_control_escolar) and get their grupo
    // Check if the input matches id_control_escolar OR card_uid
    let student_row: Option<(String, String)> = sqlx::query_as(
        "SELECT id_control_escolar, grupo FROM estudiantes WHERE id_control_escolar = ? OR card_uid = ?"
    )
    .bind(&payload.student_id)
    .bind(&payload.student_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(serde_json::json!({"error": e.to_string()})),
    ))?;

    let (resolved_student_id, student_grupo) = match student_row {
        Some(row) => row,
        None => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(
                    serde_json::json!({"error": format!("Student not found for ID/UID: {}", payload.student_id)}),
                ),
            ));
        }
    };

    // Count records for this student today to determine Entry vs Exit
    let today_start = Local::now().format("%Y-%m-%d").to_string();
    let count: i64 = sqlx::query(
        "SELECT count(*) FROM asistencias WHERE id_control_escolar = ? AND substr(fecha_asistencia, 1, 10) = ?"
    )
    .bind(&resolved_student_id)
    .bind(today_start)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (
         StatusCode::INTERNAL_SERVER_ERROR,
         Json(serde_json::json!({"error": e.to_string()})),
    ))?
    .get(0);

    let status_type = if count % 2 == 0 { "ENTRADA" } else { "SALIDA" };

    // Use the student's grupo as the classroom
    let final_classroom = student_grupo.clone();

    sqlx::query(
        "INSERT INTO asistencias (id_control_escolar, registrado_por, fecha_asistencia, salon_clase, presente) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(resolved_student_id)
    .bind(payload.user_id)
    .bind(now)
    .bind(&final_classroom)
    .bind(payload.present)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
    })?;

    Ok(Json(serde_json::json!({
        "message": "Asistencia registrada",
        "type": status_type,
        "classroom": final_classroom,
        "count": count + 1
    })))
}

pub async fn get_attendance_history(
    State(state): State<AppState>,
) -> Result<Json<Vec<AttendanceHistoryResponse>>, (StatusCode, Json<serde_json::Value>)> {
    let history = sqlx::query_as::<_, AttendanceHistoryResponse>(
        r#"
        SELECT 
            a.id_asistencia,
            a.id_control_escolar,
            (e.nombres || ' ' || e.apellido_paterno) as nombre_completo,
            a.fecha_asistencia,
            a.salon_clase,
            a.presente
        FROM asistencias a
        JOIN estudiantes e ON a.id_control_escolar = e.id_control_escolar
        ORDER BY a.fecha_asistencia DESC
        LIMIT 50
        "#,
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
