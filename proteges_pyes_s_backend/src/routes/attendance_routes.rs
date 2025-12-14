use crate::handlers::attendance_handlers::{get_attendance_history, register_attendance};
use crate::state::SharedState;
use axum::{
    routing::{get, post},
    Router,
};

pub fn attendance_routes() -> Router<SharedState> {
    Router::new()
        .route("/", post(register_attendance))
        .route("/history", get(get_attendance_history))
}
