mod db;
mod handlers;
mod models;
mod routes;

use sqlx::sqlite::SqlitePoolOptions;
use std::net::SocketAddr;

const DATABASE_URL: &str = "alumnos.db";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let pool = SqlitePoolOptions::new()
        .connect_with(
            sqlx::sqlite::SqliteConnectOptions::new()
                .filename(DATABASE_URL)
                .create_if_missing(true),
        )
        .await?;

    println!("[*] Conexión a base de datos establecida.");

    db::init(&pool).await?;
    if let Err(e) = db::init_admin_user(&pool).await {
        eprintln!("Error initializing admin user: {}", e);
    }
    if let Err(e) = db::init_fake_teachers(&pool).await {
        eprintln!("Error initializing teachers: {}", e);
    }
    db::init_fake_groups(&pool).await?;
    db::init_fake_students(&pool).await?;

    let app = routes::create_router(pool);

    //let addr = SocketAddr::from(([0, 0, 0, 0], 5000));
    let addr = SocketAddr::from(([127, 0, 0, 1], 5000));
    println!("[*] Corriendo API en http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
