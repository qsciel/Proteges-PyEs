use crate::handlers::*;
use axum::{
    Router,
    routing::{get, post},
};
use sqlx::{Pool, Sqlite};
use tower_http::cors::{Any, CorsLayer};

pub fn create_router(pool: Pool<Sqlite>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/student", post(create_student))
        .route("/student/{id}", get(get_student))
        .route("/student/{id}/group", post(update_student_group))
        .route("/login", post(login))
        .route("/users", post(create_user).get(get_users))
        .route("/scan", post(register_scan))
        .route("/scan/toggle", post(toggle_scan_status))
        .route("/emergency", get(get_emergency_students))
        .route("/emergency/history", get(get_scan_history))
        .route("/emergency/trigger", post(trigger_emergency))
        .route("/emergency/status", get(get_emergency_status))
        .route("/stats", get(get_stats))
        .route("/groups", post(create_group).get(get_groups))
        .layer(cors)
        .with_state(pool)
}
