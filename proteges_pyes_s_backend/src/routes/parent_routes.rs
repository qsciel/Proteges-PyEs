use axum::{routing::get, Router};

use crate::handlers::parent_handlers::get_student_portal_info;
use crate::state::SharedState;

pub fn parent_routes() -> Router<SharedState> {
    Router::<SharedState>::new().route("/student/{id}", get(get_student_portal_info))
}
