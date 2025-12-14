use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Student {
    #[sqlx(rename = "id_control_escolar")]
    pub id: String,
    #[sqlx(rename = "nombres")]
    pub names: String,
    #[sqlx(rename = "apellido_paterno")]
    pub paternal_last_name: String,
    #[sqlx(rename = "apellido_materno")]
    pub maternal_last_name: Option<String>,
    #[sqlx(rename = "fecha_nacimiento")]
    pub birth_date: String,
    #[sqlx(rename = "especialidad")]
    pub major: String,
    #[sqlx(rename = "grupo")]
    pub group: String,
    #[sqlx(rename = "tipo_de_sangre")]
    pub blood_type: Option<String>,
    #[sqlx(rename = "alergias")]
    pub allergies: Option<String>,
    #[sqlx(rename = "enfermedades_cronicas")]
    pub chronic_diseases: Option<String>,
    #[sqlx(rename = "domicilio")]
    pub domicile: Option<String>,
    #[sqlx(rename = "telefono_personal")]
    pub personal_phone: Option<String>,
    #[sqlx(rename = "telefono_tutor_principal")]
    pub primary_guardian_phone: Option<String>,
    #[sqlx(rename = "telefono_tutor_secundario")]
    pub secondary_guardian_phone: Option<String>,
    #[sqlx(rename = "telefono_emergencia")]
    pub emergency_phone: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStudentRequest {
    pub id: String,
    pub names: String,
    pub paternal_last_name: String,
    pub maternal_last_name: Option<String>,
    pub birth_date: String,
    pub major: String,
    pub group: String,
    pub blood_type: Option<String>,
    pub allergies: Option<String>,
    pub chronic_diseases: Option<String>,
    pub domicile: Option<String>,
    pub personal_phone: Option<String>,
    pub primary_guardian_phone: Option<String>,
    pub secondary_guardian_phone: Option<String>,
    pub emergency_phone: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStudentRequest {
    pub names: String,
    pub paternal_last_name: String,
    pub maternal_last_name: Option<String>,
    pub birth_date: String,
    pub major: String,
    pub group: String,
    pub blood_type: Option<String>,
    pub allergies: Option<String>,
    pub chronic_diseases: Option<String>,
    pub domicile: Option<String>,
    pub personal_phone: Option<String>,
    pub primary_guardian_phone: Option<String>,
    pub secondary_guardian_phone: Option<String>,
    pub emergency_phone: Option<String>,
}
