use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Group {
    #[sqlx(rename = "id_nomenclatura")]
    pub id: String,
    #[sqlx(rename = "especialidad")]
    pub major: String,
    #[sqlx(rename = "descripcion")]
    pub description: Option<String>,
}
