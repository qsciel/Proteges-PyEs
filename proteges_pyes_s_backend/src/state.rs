use sqlx::{Pool, Sqlite};

// estado compartido de la aplicación
#[derive(Clone)]
pub struct AppState {
    // pool de base de datos
    pub db: Pool<Sqlite>,
}

// alias para el estado compartido
pub type SharedState = AppState;

// permitir extraer el pool de la base de datos desde el estado
impl axum::extract::FromRef<AppState> for Pool<Sqlite> {
    fn from_ref(state: &AppState) -> Self {
        state.db.clone()
    }
}
