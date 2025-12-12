use axum::{Json, extract::State, http::StatusCode};
use serde::Deserialize;
use sqlx::{Pool, Sqlite};

use crate::models::user::User;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

pub async fn login_request(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<User>, (StatusCode, Json<serde_json::Value>)> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM usuarios WHERE nombre_usuario = ?")
        .bind(&payload.username)
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
        Some(user) => {
            if bcrypt::verify(&payload.password, &user.password_hash).unwrap_or(false) {
                Ok(Json(user))
            } else {
                Err((
                    StatusCode::UNAUTHORIZED,
                    Json(serde_json::json!({"error": "Credenciales inválidas"})),
                ))
            }
        }
        None => Err((
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error": "Credenciales inválidas"})),
        )),
    }
}
