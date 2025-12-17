use crate::{
    models::attendance::{AttendanceHistoryResponse, AttendanceRecord, CreateAttendanceRequest},
    state::AppState,
    utils::notifications::send_push_notification,
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

    let result = sqlx::query(
        "INSERT INTO asistencias (id_control_escolar, registrado_por, fecha_asistencia, salon_clase, presente) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&resolved_student_id)
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

    let id_asistencia = result.last_insert_rowid();

    // 4. Send Push Notification (async, don't block response)
    let db_pool_clone = state.db.clone();
    let student_id_clone = resolved_student_id.clone();
    let classroom_clone = final_classroom.clone();
    let type_str = if status_type == "ENTRADA" {
        "entrada"
    } else {
        "salida"
    };

    // Cloning status_type is tricky because it's a &str slice reference to a string literal.
    // Better capture the String variant.
    let type_string = type_str.to_string();

    tokio::spawn(async move {
        // Need to pass the pool, but it must be thread safe (sqlite pool is).
        let title = "Registro de Asistencia";
        let body = format!(
            "Tu hijo/a registró {} en el salón {} a las {}",
            type_string,
            classroom_clone,
            chrono::Local::now().format("%H:%M")
        );

        if let Err(e) =
            send_push_notification(&db_pool_clone, &student_id_clone, title, &body).await
        {
            println!("Error enviando notificación: {}", e);
        }
    });

    Ok(Json(serde_json::json!({
        "message": "Asistencia registrada",
        "type": status_type,
        "classroom": final_classroom,
        "count": count + 1,
        "id_asistencia": id_asistencia
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
