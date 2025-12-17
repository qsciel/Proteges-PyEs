use crate::{
    handlers::justification_handlers::{
        get_pending_justifications, submit_justification, update_justification_status,
    },
    state::SharedState,
};
use axum::{
    routing::{get, post, put},
    Router,
};

pub fn justification_routes() -> Router<SharedState> {
    Router::<SharedState>::new()
        .route("/submit", post(submit_justification))
        .route("/pending", get(get_pending_justifications))
        .route("/{id}/status", put(update_justification_status))
}
