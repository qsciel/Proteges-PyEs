mod constants;
mod db;
mod handlers;
mod models;
mod routes;
mod state;

use sqlx::sqlite::SqlitePoolOptions;
use std::net::SocketAddr;
use tracing::{info, warn};

use crate::{routes::create_router, state::AppState};

// puede ser url o archivo
const DB_ROUTE: &str = "proteges_pyes_s.db";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // inicializar tracing para logging asicronono con axum y sqlx
    tracing_subscriber::fmt::init();

    let pool = SqlitePoolOptions::new()
        .connect_with(
            sqlx::sqlite::SqliteConnectOptions::new()
                .filename(DB_ROUTE)
                .create_if_missing(true),
        )
        .await?;

    info!("Conectado a la base de datos en '{}'", DB_ROUTE);

    // inicializar la base de datos
    db::init_db(&pool).await?;
    // crear el usuario operador/admin si no existe
    if let Err(e) = db::init_operator(&pool).await {
        warn!("Error crear el operador/admin: {}", e);
    }
    // crear docentes de prueba si no existen
    if let Err(e) = db::init_teachers(&pool).await {
        warn!("Error al crear docentes: {}", e);
    }
    // crear grupos de prueba si no existen
    db::init_groups(&pool).await?;
    // crear estudiantes de prueba si no existen
    db::init_students(&pool).await?;

    // crear el estado compartido
    let state = AppState {
        db: pool.clone(),
        emergency_active: std::sync::Arc::new(tokio::sync::RwLock::new(false)),
    };
    // crear el router con las rutas y el estado
    let app = create_router().with_state(state);

    // 127.0.0.1 para tunnel y 0.0.0.0 para red local
    let addr = SocketAddr::from(([0, 0, 0, 0], 5000));
    //let addr = SocketAddr::from(([127, 0, 0, 1], 5000));

    info!("Corriendo API en http://{}", addr);

    // iniciar el servidor
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
