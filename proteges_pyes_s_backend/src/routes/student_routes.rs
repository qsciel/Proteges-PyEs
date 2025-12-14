use axum::{
    routing::{get, post},
    Router,
};

use crate::handlers::student_handlers::{
    create_student, get_all_students, get_student, update_student_group,
};
use crate::state::SharedState;

pub fn student_routes() -> Router<SharedState> {
    Router::<SharedState>::new()
        .route("/", post(create_student))
        .route("/all", get(get_all_students))
        .route("/{id}", get(get_student))
        .route(
            "/{id}/update",
            post(crate::handlers::student_handlers::update_student),
        )
        .route("/{id}/group", post(update_student_group))
}
