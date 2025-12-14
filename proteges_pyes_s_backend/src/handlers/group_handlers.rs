use axum::{extract::State, http::StatusCode, Json};
use sqlx::{Pool, Sqlite};

use crate::models::group::Group;

pub async fn get_all_groups(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<Group>>, (StatusCode, Json<serde_json::Value>)> {
    let groups = sqlx::query_as::<_, Group>("SELECT * FROM grupos")
        .fetch_all(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error al consultar grupos"})),
            )
        })?;

    Ok(Json(groups))
}
