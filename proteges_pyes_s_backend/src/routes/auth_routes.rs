use axum::{Router, routing::post};

use crate::handlers::auth_handlers::login_request;

use crate::state::SharedState;

pub fn auth_routes() -> Router<SharedState> {
    Router::<SharedState>::new().route("/login", post(login_request))
}
