use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use bcrypt::{hash, DEFAULT_COST};
use sqlx::{Pool, Sqlite};

use crate::{
    constants,
    models::user::{CreateUserRequest, User},
};

pub async fn get_user(
    Path(username): Path<String>,
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<User>, (StatusCode, Json<serde_json::Value>)> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM usuarios WHERE nombre_usuario = ?")
        .bind(username)
        .fetch_optional(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Error al consultar la base de datos"
                })),
            )
        })?;
    match user {
        Some(user) => Ok(Json(user)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Usuario no encontrado"})),
        )),
    }
}

pub async fn get_all_users(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<User>>, (StatusCode, Json<serde_json::Value>)> {
    let users = sqlx::query_as::<_, User>("SELECT * FROM usuarios")
        .fetch_all(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error al consultar la base de datos"})),
            )
        })?;
    Ok(Json(users))
}

pub async fn create_user(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    if payload.username.trim().is_empty() || payload.password.trim().len() < 4 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                serde_json::json!({"error": "Usuario o contraseña deben de contener al menos 4 carácteres"}),
            ),
        ));
    }
    if payload.display_name.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Usuario mostrado no puede estar vacío"})),
        ));
    }
    let password_hash = hash(payload.password, DEFAULT_COST).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Hashing error"})),
        )
    })?;
    let valid_roles = constants::ROLES;
    if !valid_roles.contains(&payload.role.as_str()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Rol inválido"})),
        ));
    }
    if payload.color.is_some() && !payload.color.as_ref().unwrap().starts_with("#") {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "Color inválido"})),
        ));
    }
    sqlx::query(
        "INSERT INTO usuarios (nombre_usuario, nombre_mostrado, hash_contrasena, rol, color_identificador, telefono_contacto) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(payload.username)
    .bind(payload.display_name)
    .bind(password_hash)
    .bind(payload.role)
    .bind(payload.color)
    .bind(payload.phone_number)
    .execute(&pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed") {
            (
                StatusCode::CONFLICT,
                Json(serde_json::json!({"error": "Usuario ya existe"})),
            )
        } else {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "No se pudo crear el usuario"})),
            )
        }
    })?;
    Ok(Json(
        serde_json::json!({"message": "Usuario creado correctamente"}),
    ))
}
