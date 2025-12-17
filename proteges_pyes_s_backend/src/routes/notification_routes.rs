use crate::{handlers::notification_handlers::register_device_token, state::SharedState};
use axum::{routing::post, Router};

pub fn notification_routes() -> Router<SharedState> {
    Router::<SharedState>::new().route("/register-token", post(register_device_token))
}
