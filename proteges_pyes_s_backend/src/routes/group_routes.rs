use axum::{routing::get, Router};

use crate::handlers::group_handlers::get_all_groups;
use crate::state::SharedState;

pub fn group_routes() -> Router<SharedState> {
    Router::<SharedState>::new().route("/", get(get_all_groups))
}
