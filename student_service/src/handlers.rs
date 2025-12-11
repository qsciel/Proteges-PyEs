use crate::models::*;
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use bcrypt::{DEFAULT_COST, hash, verify};
use sqlx::{Pool, Row, Sqlite};

// ... (Existing handlers: login, create_user)

pub async fn login(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<User>, (StatusCode, Json<serde_json::Value>)> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = ?")
        .bind(payload.username)
        .fetch_optional(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;

    if let Some(user) = user {
        if verify(&payload.password, &user.password_hash).unwrap_or(false) {
            return Ok(Json(user));
        }
    }

    Err((
        StatusCode::UNAUTHORIZED,
        Json(serde_json::json!({"error": "Invalid credentials"})),
    ))
}

pub async fn create_user(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Input Validation
    if payload.username.trim().is_empty() || payload.password.trim().len() < 4 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                serde_json::json!({"error": "Username required and password must be at least 4 chars"}),
            ),
        ));
    }

    let valid_roles = ["Admin", "Teacher", "Regular", "SuperUser"];
    if !valid_roles.contains(&payload.role.as_str()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Invalid role"})),
        ));
    }

    let password_hash = hash(payload.password, DEFAULT_COST).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Hashing error"})),
        )
    })?;

    sqlx::query(
        "INSERT INTO users (username, password_hash, role, color, nombre) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(payload.username)
    .bind(password_hash)
    .bind(payload.role)
    .bind(payload.color)
    .bind(payload.nombre)
    .execute(&pool)
    .await
    .map_err(|e| {
        // Check for unique constraint violation
        if e.to_string().contains("UNIQUE constraint failed") {
            (
                StatusCode::CONFLICT,
                Json(serde_json::json!({"error": "Username already exists"})),
            )
        } else {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Could not create user"})),
            )
        }
    })?;

    Ok(Json(
        serde_json::json!({"message": "User created successfully"}),
    ))
}

pub async fn register_scan(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<ScanRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let timestamp = chrono::Local::now().to_rfc3339();

    // Check if emergency is active
    let active_start_time: Option<String> = sqlx::query(
        "SELECT start_time FROM emergency_events WHERE active = true ORDER BY id DESC LIMIT 1",
    )
    .fetch_optional(&pool)
    .await
    .unwrap_or(None)
    .map(|row| row.get(0));

    if let Some(start_time) = active_start_time {
        // Emergency is active. Check if student already scanned in this window.
        let already_scanned: bool =
            sqlx::query("SELECT count(*) FROM scans WHERE student_id = ? AND timestamp >= ?")
                .bind(&payload.student_id)
                .bind(&start_time)
                .fetch_one(&pool)
                .await
                .map(|row| row.get::<i64, _>(0) > 0)
                .unwrap_or(false);

        if already_scanned {
            return Err((
                StatusCode::CONFLICT,
                Json(serde_json::json!({"error": "Student already marked as safe"})),
            ));
        }
    }

    sqlx::query(
        "INSERT INTO scans (student_id, user_id, timestamp, scan_type) VALUES (?, ?, ?, ?)",
    )
    .bind(payload.student_id.clone())
    .bind(payload.user_id)
    .bind(timestamp.clone())
    .bind(payload.scan_type)
    .execute(&pool)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Could not register scan"})),
        )
    })?;

    // LOG HISTORY
    sqlx::query(
        "INSERT INTO scan_history (student_id, user_id, action, timestamp) VALUES (?, ?, ?, ?)",
    )
    .bind(payload.student_id)
    .bind(payload.user_id)
    .bind("SAFE_QR")
    .bind(timestamp)
    .execute(&pool)
    .await
    .ok();

    Ok(Json(serde_json::json!({"message": "Scan registered"})))
}

pub async fn trigger_emergency(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<EmergencyTriggerRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let timestamp = chrono::Local::now().to_rfc3339();

    if payload.active {
        // Start emergency: Create new event and ensure fresh start
        sqlx::query(
            "INSERT INTO emergency_events (active, start_time, triggered_by) VALUES (true, ?, ?)",
        )
        .bind(timestamp)
        .bind(payload.user_id)
        .execute(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;
    } else {
        // End emergency: Close event and reset scans logic (conceptually handled by frontend resetting views or backend ignoring old scans next time)
        // Here we just close the event.
        sqlx::query("UPDATE emergency_events SET active = false, end_time = ? WHERE active = true")
            .bind(timestamp)
            .execute(&pool)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({"error": "Database error"})),
                )
            })?;
    }

    Ok(Json(
        serde_json::json!({"message": "Emergency status updated"}),
    ))
}

// ... (existing getters: get_emergency_status, get_stats, get_groups, create_group)

pub async fn get_emergency_status(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let active: bool = sqlx::query("SELECT count(*) FROM emergency_events WHERE active = true")
        .fetch_one(&pool)
        .await
        .map(|row| row.get::<i64, _>(0) > 0)
        .unwrap_or(false);

    Ok(Json(serde_json::json!({"active": active})))
}

pub async fn get_stats(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<StatsResponse>, (StatusCode, Json<serde_json::Value>)> {
    let total_students: i64 = sqlx::query("SELECT count(*) FROM alumnos")
        .fetch_one(&pool)
        .await
        .map(|row| row.get(0))
        .unwrap_or(0);

    let scans_today: i64 =
        sqlx::query("SELECT count(*) FROM scans WHERE date(timestamp) = date('now')")
            .fetch_one(&pool)
            .await
            .map(|row| row.get(0))
            .unwrap_or(0);

    let active_emergency: bool =
        sqlx::query("SELECT count(*) FROM emergency_events WHERE active = true")
            .fetch_one(&pool)
            .await
            .map(|row| row.get::<i64, _>(0) > 0)
            .unwrap_or(false);

    Ok(Json(StatsResponse {
        total_students,
        scans_today,
        active_emergency,
    }))
}

pub async fn get_groups(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<Group>>, (StatusCode, Json<serde_json::Value>)> {
    let groups = sqlx::query_as::<_, Group>("SELECT * FROM groups")
        .fetch_all(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;

    Ok(Json(groups))
}

pub async fn create_group(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<CreateGroupRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query("INSERT INTO groups (name, description) VALUES (?, ?)")
        .bind(payload.name)
        .bind(payload.description)
        .execute(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;

    Ok(Json(serde_json::json!({"message": "Group created"})))
}

pub async fn get_emergency_students(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<StudentWithStatus>>, (StatusCode, Json<serde_json::Value>)> {
    // Only fetch scans that happened *after* the current emergency started
    // If no emergency is active, this query might return old data, but usually frontend only requests this when Active.
    // For robustness, we check for the latest active emergency start time.

    let active_start_time: Option<String> = sqlx::query(
        "SELECT start_time FROM emergency_events WHERE active = true ORDER BY id DESC LIMIT 1",
    )
    .fetch_optional(&pool)
    .await
    .unwrap_or(None)
    .map(|row| row.get(0));

    let scan_condition = if let Some(start_time) = active_start_time {
        format!("AND sc.timestamp >= '{}'", start_time)
    } else {
        // If no active emergency, maybe just show no scans or all scans?
        // User requested: "list of students will appear only when the emergency is triggered"
        // But also "reset... marking them they were safe". Relying on timestamp filter creates a fresh session.
        "AND 1=0".to_string() // Return no scans if no emergency
    };

    // We still want ALL students, but their status depends on scans within the emergency window
    let query = format!(
        r#"
        SELECT s.*, 
               (SELECT color FROM users u JOIN scans sc ON u.id = sc.user_id WHERE sc.student_id = s.id {} ORDER BY sc.timestamp DESC LIMIT 1) as scan_color,
               (SELECT nombre FROM users u JOIN scans sc ON u.id = sc.user_id WHERE sc.student_id = s.id {} ORDER BY sc.timestamp DESC LIMIT 1) as scan_teacher_name,
               (SELECT timestamp FROM scans sc WHERE sc.student_id = s.id {} ORDER BY sc.timestamp DESC LIMIT 1) as scan_timestamp
        FROM alumnos s
        "#,
        scan_condition, scan_condition, scan_condition
    );

    let students = sqlx::query_as::<_, StudentWithStatus>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            eprintln!("Error fetching students: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;

    Ok(Json(students))
}

pub async fn get_users(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<User>>, (StatusCode, Json<serde_json::Value>)> {
    let users = sqlx::query_as::<_, User>("SELECT * FROM users")
        .fetch_all(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;

    Ok(Json(users))
}

pub async fn get_student(
    Path(id): Path<String>,
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Alumno>, (StatusCode, Json<serde_json::Value>)> {
    let student = sqlx::query_as::<_, Alumno>("SELECT * FROM alumnos WHERE id = ?")
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error de base de datos"})),
            )
        })?;

    match student {
        Some(alumno) => Ok(Json(alumno)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Alumno no encontrado"})),
        )),
    }
}

// NEW HANDLERS

pub async fn create_student(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<CreateStudentRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query(
        r#"
        INSERT INTO alumnos 
        (id, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, tipo_de_sangre, alergias, enfermedades_cronicas, numero_telefono, numero_tutor, grupo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(payload.id)
    .bind(payload.nombre)
    .bind(payload.apellido_paterno)
    .bind(payload.apellido_materno)
    .bind(payload.fecha_nacimiento)
    .bind(payload.tipo_de_sangre)
    .bind(payload.alergias)
    .bind(payload.enfermedades_cronicas)
    .bind(payload.numero_telefono)
    .bind(payload.numero_tutor)
    .bind(payload.grupo)
    .execute(&pool)
    .await
    .map_err(|e| {
         if e.to_string().contains("UNIQUE constraint failed") {
            (
                StatusCode::CONFLICT,
                Json(serde_json::json!({"error": "Student ID already exists"})),
            )
        } else {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        }
    })?;

    Ok(Json(serde_json::json!({"message": "Student registered"})))
}

pub async fn update_student_group(
    Path(id): Path<String>,
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<UpdateStudentGroupRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query("UPDATE alumnos SET grupo = ? WHERE id = ?")
        .bind(payload.group)
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;

    Ok(Json(
        serde_json::json!({"message": "Student group updated"}),
    ))
}

pub async fn toggle_scan_status(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<ToggleScanRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Check if student has a scan in the current emergency window
    let active_start_time: Option<String> = sqlx::query(
        "SELECT start_time FROM emergency_events WHERE active = true ORDER BY id DESC LIMIT 1",
    )
    .fetch_optional(&pool)
    .await
    .unwrap_or(None)
    .map(|row| row.get(0));

    if let Some(start_time) = active_start_time {
        // Check recent scan
        let has_scan =
            sqlx::query("SELECT count(*) FROM scans WHERE student_id = ? AND timestamp >= ?")
                .bind(&payload.student_id)
                .bind(&start_time)
                .fetch_one(&pool)
                .await
                .map(|row| row.get::<i64, _>(0) > 0)
                .unwrap_or(false);

        if has_scan {
            // Delete scans in this window to mark as "Missing" again
            // Delete scans in this window to mark as "Missing" again
            sqlx::query("DELETE FROM scans WHERE student_id = ? AND timestamp >= ?")
                .bind(&payload.student_id)
                .bind(&start_time)
                .execute(&pool)
                .await
                .map_err(|_| {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(serde_json::json!({"error": "Failed to reset status"})),
                    )
                })?;

            // LOG HISTORY REVOKED
            let timestamp = chrono::Local::now().to_rfc3339();
            sqlx::query("INSERT INTO scan_history (student_id, user_id, action, timestamp) VALUES (?, ?, ?, ?)")
                .bind(&payload.student_id)
                .bind(payload.user_id)
                .bind("REVOKED")
                .bind(timestamp)
                .execute(&pool)
                .await
                .ok();

            Ok(Json(
                serde_json::json!({"message": "Status reset to Missing"}),
            ))
        } else {
            // Add scan to mark as "Safe" (Manual override)
            let timestamp = chrono::Local::now().to_rfc3339();
            // Manually registered by Manual Toggle (scan_type="manual")
            sqlx::query(
                "INSERT INTO scans (student_id, user_id, timestamp, scan_type) VALUES (?, ?, ?, 'manual')",
            )
            .bind(&payload.student_id)
            .bind(payload.user_id)
            .bind(&timestamp)
            .execute(&pool)
            .await
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": "Failed to set status"}))))?;

            // LOG HISTORY SAFE_MANUAL
            sqlx::query("INSERT INTO scan_history (student_id, user_id, action, timestamp) VALUES (?, ?, ?, ?)")
                .bind(&payload.student_id)
                .bind(payload.user_id)
                .bind("SAFE_MANUAL")
                .bind(timestamp)
                .execute(&pool)
                .await
                .ok();

            Ok(Json(serde_json::json!({"message": "Status set to Safe"})))
        }
    } else {
        Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "No active emergency"})),
        ))
    }
}

pub async fn get_scan_history(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<ScanHistoryItem>>, (StatusCode, Json<serde_json::Value>)> {
    let active_start_time: Option<String> = sqlx::query(
        "SELECT start_time FROM emergency_events WHERE active = true ORDER BY id DESC LIMIT 1",
    )
    .fetch_optional(&pool)
    .await
    .unwrap_or(None)
    .map(|row| row.get(0));

    let where_clause = if let Some(start_time) = active_start_time {
        format!("WHERE h.timestamp >= '{}'", start_time)
    } else {
        "WHERE 1=0".to_string()
    };

    let query = format!(
        r#"
        SELECT h.id, 
               s.nombre || ' ' || s.apellido_paterno as student_name,
               u.nombre as user_name,
               h.action,
               h.timestamp
        FROM scan_history h
        JOIN alumnos s ON h.student_id = s.id
        JOIN users u ON h.user_id = u.id
        {}
        ORDER BY h.timestamp DESC
        "#,
        where_clause
    );

    let history = sqlx::query_as::<_, ScanHistoryItem>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            eprintln!("History error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Database error"})),
            )
        })?;

    Ok(Json(history))
}
