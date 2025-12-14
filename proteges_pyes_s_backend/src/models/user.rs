use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    #[sqlx(rename = "id_usuario")]
    pub id: i64,
    #[sqlx(rename = "nombre_usuario")]
    pub username: String,
    #[sqlx(rename = "nombre_mostrado")]
    pub display_name: String,
    #[serde(skip)]
    #[sqlx(rename = "hash_contrasena")]
    pub password_hash: String,
    #[sqlx(rename = "rol")]
    pub role: String,
    #[sqlx(rename = "color_identificador")]
    pub color: Option<String>,
    #[sqlx(rename = "telefono_contacto")]
    pub phone_number: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub display_name: String,
    pub password: String,
    pub role: String,
    pub color: Option<String>,
    pub phone_number: Option<String>,
}
