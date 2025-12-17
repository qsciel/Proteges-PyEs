use axum::{extract::State, http::StatusCode, Json};
use sqlx::{Pool, Sqlite};

use crate::{
    models::{
        scan::{EmergencyStatus, EmergencyStudent, EmergencyTriggerRequest, ScanHistoryItem},
        student::Student,
    },
    state::AppState,
    utils::notifications::broadcast_emergency_notification,
};

pub async fn get_emergency_students(
    State(state): State<AppState>,
) -> Result<Json<Vec<EmergencyStudent>>, (StatusCode, Json<serde_json::Value>)> {
    // Get all students
    let students = sqlx::query_as::<_, Student>("SELECT * FROM estudiantes")
        .fetch_all(&state.db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error al consultar estudiantes"})),
            )
        })?;

    // Get scanned student IDs
    let scanned_ids: Vec<String> =
        sqlx::query_scalar("SELECT DISTINCT estudiante_consultado FROM historial_consulta")
            .fetch_all(&state.db)
            .await
            .unwrap_or_default();

    // ✅ OPTIMIZACIÓN: Obtener color del docente una sola vez (era N+1 antes)
    let teacher_color: Option<String> = sqlx::query_scalar(
        "SELECT color_identificador FROM usuarios WHERE rol = 'Docente' LIMIT 1",
    )
    .fetch_optional(&state.db)
    .await
    .unwrap_or(None);

    // Crear lista de estudiantes para emergencia
    let mut emergency_students = Vec::new();
    for student in students {
        emergency_students.push(EmergencyStudent {
            id: student.id.clone(),
            names: student.names,
            paternal_last_name: student.paternal_last_name,
            maternal_last_name: student.maternal_last_name.unwrap_or_default(),
            group: student.group,
            major: student.major,
            scanned: scanned_ids.contains(&student.id),
            teacher_color: teacher_color.clone(), // Usar el mismo color para todos
        });
    }

    Ok(Json(emergency_students))
}

pub async fn get_emergency_history(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<ScanHistoryItem>>, (StatusCode, Json<serde_json::Value>)> {
    let history = sqlx::query_as::<_, ScanHistoryItem>(
        r#"
        SELECT 
            h.id_escaneo, 
            h.estudiante_consultado,
            COALESCE(e.nombres || ' ' || e.apellido_paterno, 'Desconocido') as student_name,
            h.consultado_por,
            COALESCE(u.display_name, 'Sistema') as user_name,
            h.fecha_consulta
        FROM historial_consulta h
        LEFT JOIN estudiantes e ON h.estudiante_consultado = e.id_control_escolar
        LEFT JOIN usuarios u ON h.consultado_por = u.id
        ORDER BY h.fecha_consulta DESC
        "#,
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_else(|e| {
        eprintln!(
            "Error fetching emergency history (returning empty): {:?}",
            e
        );
        Vec::new() // Return empty vector instead of error
    });

    Ok(Json(history))
}

pub async fn trigger_emergency(
    State(state): State<AppState>,
    Json(payload): Json<EmergencyTriggerRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Update emergency state
    let mut emergency_active = state.emergency_active.write().await;
    *emergency_active = payload.active;

    // Update emergency state in DB
    sqlx::query("UPDATE system_state SET emergency_active = ?")
        .bind(payload.active)
        .execute(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": e.to_string()})),
            )
        })?;

    if payload.active {
        // Clear previous scan history when activating emergency
        sqlx::query("DELETE FROM historial_consulta")
            .execute(&state.db)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Error al activar emergencia"})),
                )
            })?;
    }

    // Broadcast Notification (async)
    let db_pool = state.db.clone();
    let active = payload.active;
    tokio::spawn(async move {
        if let Err(e) = broadcast_emergency_notification(&db_pool, active).await {
            println!("Error broadcasting emergency: {}", e);
        }
    });

    Ok(Json(serde_json::json!({
        "message": "Emergency status updated",
        "active": payload.active
    })))
}

pub async fn get_emergency_status(
    State(state): State<AppState>,
) -> Result<Json<EmergencyStatus>, StatusCode> {
    let emergency_active = state.emergency_active.read().await;
    Ok(Json(EmergencyStatus {
        active: *emergency_active,
    }))
}
