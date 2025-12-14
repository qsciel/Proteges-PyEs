use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;
use sqlx::{Pool, Row, Sqlite};

#[derive(Serialize)]
pub struct Stats {
    pub total_students: i64,
    pub total_users: i64,
    pub total_scans: i64,
    pub total_groups: i64,
}

pub async fn get_stats(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Stats>, (StatusCode, Json<serde_json::Value>)> {
    let total_students: i64 = sqlx::query("SELECT COUNT(*) FROM estudiantes")
        .fetch_one(&pool)
        .await
        .map(|row| row.get(0))
        .unwrap_or(0);

    let total_users: i64 = sqlx::query("SELECT COUNT(*) FROM usuarios")
        .fetch_one(&pool)
        .await
        .map(|row| row.get(0))
        .unwrap_or(0);

    let total_scans: i64 = sqlx::query("SELECT COUNT(*) FROM historial_consulta")
        .fetch_one(&pool)
        .await
        .map(|row| row.get(0))
        .unwrap_or(0);

    let total_groups: i64 = sqlx::query("SELECT COUNT(*) FROM grupos")
        .fetch_one(&pool)
        .await
        .map(|row| row.get(0))
        .unwrap_or(0);

    Ok(Json(Stats {
        total_students,
        total_users,
        total_scans,
        total_groups,
    }))
}
