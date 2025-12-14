use axum::{routing::post, Router};

use crate::handlers::scan_handlers::{register_scan, toggle_scan_status};
use crate::state::SharedState;

pub fn scan_routes() -> Router<SharedState> {
    Router::<SharedState>::new()
        .route("/", post(register_scan))
        .route("/toggle", post(toggle_scan_status))
}
