use axum::{routing::get, Router};

use crate::handlers::stats_handlers::get_stats;
use crate::state::SharedState;

pub fn stats_routes() -> Router<SharedState> {
    Router::<SharedState>::new().route("/", get(get_stats))
}
