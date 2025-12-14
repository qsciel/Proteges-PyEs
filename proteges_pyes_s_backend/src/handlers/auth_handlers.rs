use axum::{extract::State, http::StatusCode, Json};
use bcrypt::verify;
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
    println!(
        "DEBUG: Login request received for user: '{}'",
        payload.username
    );
    println!("DEBUG: Searching in table 'usuarios'...");

    // Fetch user without mapping error immediately so we can match on it
    let user_result = sqlx::query_as::<_, User>("SELECT * FROM usuarios WHERE nombre_usuario = ?")
        .bind(&payload.username)
        .fetch_optional(&pool)
        .await;

    match user_result {
        Ok(Some(user)) => {
            println!("DEBUG: User found in DB: {:?}", user);
            println!(
                "DEBUG: Verifying password (hash length: {})...",
                user.password_hash.len()
            );

            // Verify password safely
            let verification_result = verify(&payload.password, &user.password_hash);

            match verification_result {
                Ok(is_valid) => {
                    if is_valid {
                        println!("DEBUG: Password correct for user: {}", user.username);
                        Ok(Json(user))
                    } else {
                        println!("DEBUG: Password incorrect for user: {}", user.username);
                        Err((
                            StatusCode::UNAUTHORIZED,
                            Json(serde_json::json!({"error": "Credenciales inválidas"})),
                        ))
                    }
                }
                Err(e) => {
                    println!("DEBUG: Bcrypt verify error: {:?}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(serde_json::json!({"error": "Error interno de validación"})),
                    ))
                }
            }
        }
        Ok(None) => {
            println!("DEBUG: User '{}' not found in database", payload.username);
            Err((
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"error": "Credenciales inválidas"})),
            ))
        }
        Err(e) => {
            println!("DEBUG: Database error during lookup: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Error al consultar la base de datos"
                })),
            ))
        }
    }
}
