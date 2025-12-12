use axum::{Router, routing::get};

use crate::handlers::student_handlers::{get_all_students, get_student};
use crate::state::SharedState;

pub fn student_routes() -> Router<SharedState> {
    Router::<SharedState>::new()
        .route("/{id}", get(get_student))
        .route("/all", get(get_all_students))
}
