mod auth_routes;
mod student_routes;
mod user_routes;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};

use crate::routes::auth_routes::auth_routes;
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
        .layer(cors)
}
