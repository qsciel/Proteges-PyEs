use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::{Pool, Sqlite};

use crate::models::{
    scan::UpdateStudentGroupRequest,
    student::{CreateStudentRequest, Student, UpdateStudentRequest},
};

pub async fn get_student(
    Path(id): Path<String>,
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Student>, (StatusCode, Json<serde_json::Value>)> {
    let student =
        sqlx::query_as::<_, Student>("SELECT * FROM estudiantes WHERE id_control_escolar = ?")
            .bind(id)
            .fetch_optional(&pool)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({
                        "error": "Error al consultar la base de datos"
                    })),
                )
            })?;
    match student {
        Some(student) => Ok(Json(student)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Estudiante no encontrado"})),
        )),
    }
}

pub async fn get_all_students(
    State(pool): State<Pool<Sqlite>>,
) -> Result<Json<Vec<Student>>, (StatusCode, Json<serde_json::Value>)> {
    let students = sqlx::query_as::<_, Student>("SELECT * FROM estudiantes")
        .fetch_all(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error al consultar la base de datos"})),
            )
        })?;
    Ok(Json(students))
}

pub async fn create_student(
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<CreateStudentRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query(
        r#"
        INSERT INTO estudiantes (
            id_control_escolar, nombres, apellido_paterno, apellido_materno,
            fecha_nacimiento, especialidad, grupo, tipo_de_sangre,
            alergias, enfermedades_cronicas, domicilio, telefono_personal,
            telefono_tutor_principal, telefono_tutor_secundario, telefono_emergencia
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&payload.id)
    .bind(&payload.names)
    .bind(&payload.paternal_last_name)
    .bind(&payload.maternal_last_name)
    .bind(&payload.birth_date)
    .bind(&payload.major)
    .bind(&payload.group)
    .bind(&payload.blood_type)
    .bind(&payload.allergies)
    .bind(&payload.chronic_diseases)
    .bind(&payload.domicile)
    .bind(&payload.personal_phone)
    .bind(&payload.primary_guardian_phone)
    .bind(&payload.secondary_guardian_phone)
    .bind(&payload.emergency_phone)
    .execute(&pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint failed") {
            (
                StatusCode::CONFLICT,
                Json(serde_json::json!({"error": "El estudiante ya existe"})),
            )
        } else {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "No se pudo crear el estudiante"})),
            )
        }
    })?;

    Ok(Json(
        serde_json::json!({"message": "Estudiante creado correctamente"}),
    ))
}

pub async fn update_student(
    Path(id): Path<String>,
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<UpdateStudentRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let result = sqlx::query(
        r#"
        UPDATE estudiantes SET 
            nombres=?, apellido_paterno=?, apellido_materno=?,
            fecha_nacimiento=?, especialidad=?, grupo=?, tipo_de_sangre=?,
            alergias=?, enfermedades_cronicas=?, domicilio=?, telefono_personal=?,
            telefono_tutor_principal=?, telefono_tutor_secundario=?, telefono_emergencia=?
        WHERE id_control_escolar=?
        "#,
    )
    .bind(&payload.names)
    .bind(&payload.paternal_last_name)
    .bind(&payload.maternal_last_name)
    .bind(&payload.birth_date)
    .bind(&payload.major)
    .bind(&payload.group)
    .bind(&payload.blood_type)
    .bind(&payload.allergies)
    .bind(&payload.chronic_diseases)
    .bind(&payload.domicile)
    .bind(&payload.personal_phone)
    .bind(&payload.primary_guardian_phone)
    .bind(&payload.secondary_guardian_phone)
    .bind(&payload.emergency_phone)
    .bind(&id)
    .execute(&pool)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Error al actualizar el estudiante"})),
        )
    })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Estudiante no encontrado"})),
        ));
    }

    Ok(Json(
        serde_json::json!({"message": "Estudiante actualizado correctamente"}),
    ))
}

pub async fn update_student_group(
    Path(id): Path<String>,
    State(pool): State<Pool<Sqlite>>,
    Json(payload): Json<UpdateStudentGroupRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let result = sqlx::query("UPDATE estudiantes SET grupo = ? WHERE id_control_escolar = ?")
        .bind(&payload.group)
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Error al actualizar el grupo"})),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Estudiante no encontrado"})),
        ));
    }

    Ok(Json(
        serde_json::json!({"message": "Grupo actualizado correctamente"}),
    ))
}
