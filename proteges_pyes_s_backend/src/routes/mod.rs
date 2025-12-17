mod attendance_routes;
mod auth_routes;
mod emergency_routes;
mod group_routes;
mod justification_routes;
mod notification_routes;
mod parent_routes;
mod scan_routes;
mod stats_routes;
mod student_routes;
mod user_routes;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

use crate::routes::attendance_routes::attendance_routes;
use crate::routes::auth_routes::auth_routes;
use crate::routes::emergency_routes::emergency_routes;
use crate::routes::group_routes::group_routes;
use crate::routes::justification_routes::justification_routes;
use crate::routes::notification_routes::notification_routes;
use crate::routes::parent_routes::parent_routes;
use crate::routes::scan_routes::scan_routes;
use crate::routes::stats_routes::stats_routes;
use crate::routes::student_routes::student_routes;
use crate::routes::user_routes::user_routes;
use crate::state::SharedState;

pub fn create_router() -> Router<SharedState> {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::<SharedState>::new()
        .nest("/auth", auth_routes())
        .nest("/student", student_routes())
        .nest("/user", user_routes())
        .nest("/scan", scan_routes())
        .nest("/emergency", emergency_routes())
        .nest("/groups", group_routes())
        .nest("/stats", stats_routes())
        .nest("/attendance", attendance_routes())
        .nest("/public", parent_routes())
        .nest("/notifications", notification_routes())
        .nest("/justifications", justification_routes())
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(cors)
}
