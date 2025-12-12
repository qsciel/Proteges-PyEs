use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sqlx::{Pool, Sqlite};

use crate::models::user::User;

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
