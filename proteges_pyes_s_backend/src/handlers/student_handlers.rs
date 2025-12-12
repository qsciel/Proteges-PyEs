use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sqlx::{Pool, Sqlite};

use crate::models::student::Student;

pub async fn get_student(
    Path(id): Path<String>,
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Student>, (StatusCode, Json<serde_json::Value>)> {
    let student =
        sqlx::query_as::<_, Student>("SELECT * FROM estudiantes WHERE id_control_escolar = ?")
            .bind(id)
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
    match student {
        Some(student) => Ok(Json(student)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Estudiante no encontrado"})),
        )),
    }
}

pub async fn get_all_students(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<Student>>, (StatusCode, Json<serde_json::Value>)> {
    let students = sqlx::query_as::<_, Student>("SELECT * FROM estudiantes")
        .fetch_all(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error al consultar la base de datos"})),
            )
        })?;
    Ok(Json(students))
}
