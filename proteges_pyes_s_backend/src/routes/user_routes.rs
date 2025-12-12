use axum::{Router, routing::get};

use crate::handlers::user_handlers::{get_all_users, get_user};
use crate::state::SharedState;

pub fn user_routes() -> Router<SharedState> {
    Router::<SharedState>::new()
        .route("/{username}", get(get_user))
        .route("/all", get(get_all_users))
}
