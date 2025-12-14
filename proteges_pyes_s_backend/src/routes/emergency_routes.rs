use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::emergency_handlers::{
    get_emergency_history, get_emergency_status, get_emergency_students, trigger_emergency,
};
use crate::state::SharedState;

pub fn emergency_routes() -> Router<SharedState> {
    Router::<SharedState>::new()
        .route("/", get(get_emergency_students))
        .route("/history", get(get_emergency_history))
        .route("/trigger", post(trigger_emergency))
        .route("/status", get(get_emergency_status))
}
