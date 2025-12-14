use sqlx::{Pool, Sqlite};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Sqlite>,
    pub emergency_active: Arc<RwLock<bool>>,
}

pub type SharedState = AppState;

impl axum::extract::FromRef<AppState> for Pool<Sqlite> {
    fn from_ref(state: &AppState) -> Self {
        state.db.clone()
    }
}
