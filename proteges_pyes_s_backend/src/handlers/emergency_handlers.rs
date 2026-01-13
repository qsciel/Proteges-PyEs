use axum::{extract::State, http::StatusCode, Json};
use sqlx::Row;

use crate::{
    models::{
        scan::{EmergencyStatus, EmergencyStudent, EmergencyTriggerRequest},
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
    State(state): State<AppState>,
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, Json<serde_json::Value>)> {
    let history = sqlx::query(
        r#"
        SELECT
            eh.id,
            eh.action,
            eh.timestamp,
            eh.total_students,
            eh.scanned_students,
            eh.missing_students,
            eh.notes,
            u.nombre_mostrado as user_name
        FROM emergency_history eh
        LEFT JOIN usuarios u ON eh.triggered_by = u.id_usuario
        ORDER BY eh.timestamp DESC
        LIMIT 50
        "#,
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_else(|e| {
        eprintln!("Error fetching emergency history: {:?}", e);
        Vec::new()
    });

    let formatted_history: Vec<serde_json::Value> = history
        .into_iter()
        .map(|record| {
            serde_json::json!({
                "id": record.get::<i64, _>("id"),
                "action": record.get::<String, _>("action"),
                "timestamp": record.get::<String, _>("timestamp"),
                "total_students": record.get::<i64, _>("total_students"),
                "scanned_students": record.get::<i64, _>("scanned_students"),
                "missing_students": record.get::<i64, _>("missing_students"),
                "user_name": record.get::<Option<String>, _>("user_name").unwrap_or_else(|| "Sistema".to_string()),
                "notes": record.get::<Option<String>, _>("notes")
            })
        })
        .collect();

    Ok(Json(formatted_history))
}

pub async fn trigger_emergency(
    State(state): State<AppState>,
    Json(payload): Json<EmergencyTriggerRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Update emergency state in memory
    let mut emergency_active = state.emergency_active.write().await;
    *emergency_active = payload.active;

    // Update emergency state in DB
    sqlx::query("UPDATE system_state SET emergency_active = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1")
        .bind(payload.active)
        .execute(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": format!("Error updating system state: {}", e)})),
            )
        })?;

    // Calculate current stats for history
    let mut total_students = 0;
    let mut scanned_students = 0;

    if payload.active {
        // Clear previous scan history when activating emergency
        sqlx::query("DELETE FROM historial_consulta")
            .execute(&state.db)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Error al limpiar historial"})),
                )
            })?;

        // Count total students
        total_students = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM estudiantes")
            .fetch_one(&state.db)
            .await
            .unwrap_or(0);
    } else {
        // When ending emergency, get final counts
        total_students = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM estudiantes")
            .fetch_one(&state.db)
            .await
            .unwrap_or(0);

        scanned_students = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(DISTINCT estudiante_consultado) FROM historial_consulta",
        )
        .fetch_one(&state.db)
        .await
        .unwrap_or(0);
    }

    let missing_students = total_students - scanned_students;

    // Save to emergency history
    let action = if payload.active {
        "ACTIVATED"
    } else {
        "DEACTIVATED"
    };
    let notes = if payload.active {
        "Protocolo de emergencia activado".to_string()
    } else {
        format!(
            "Emergencia finalizada - {} de {} estudiantes localizados",
            scanned_students, total_students
        )
    };

    sqlx::query(
        "INSERT INTO emergency_history (action, triggered_by, total_students, scanned_students, missing_students, notes) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(action)
    .bind(payload.user_id)
    .bind(total_students)
    .bind(scanned_students)
    .bind(missing_students)
    .bind(notes)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("Error saving emergency history: {}", e);
        // Don't fail the request if history save fails
    })
    .ok();

    // Broadcast Notification (async)
    let db_pool = state.db.clone();
    let active = payload.active;
    tokio::spawn(async move {
        if let Err(e) = broadcast_emergency_notification(&db_pool, active).await {
            println!("Error broadcasting emergency: {}", e);
        }
    });

    Ok(Json(serde_json::json!({
        "message": if payload.active { "Emergencia activada" } else { "Emergencia desactivada" },
        "active": payload.active,
        "stats": {
            "total": total_students,
            "scanned": scanned_students,
            "missing": missing_students
        }
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
