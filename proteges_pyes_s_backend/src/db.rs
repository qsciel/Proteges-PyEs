use bcrypt::{hash, DEFAULT_COST};
use sqlx::{Pool, Row, Sqlite};
use tracing::info;

// inicializar la base de datos con migraciones
pub async fn init_db(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // estan de 0001...0002...etc. para que se creen en orden
    sqlx::migrate!("./migrations").run(pool).await?;
    Ok(())
}

// crear el usuario operador/admin si no existe
pub async fn init_operator(pool: &Pool<Sqlite>) -> Result<(), Box<dyn std::error::Error>> {
    // checamos si no existe un operador
    let count: i64 =
        sqlx::query("SELECT count(*) FROM usuarios WHERE nombre_usuario = 'operador_pyes_s'")
            .fetch_one(pool)
            .await?
            .get(0);

    if count == 0 {
        // !proteges.operador2477 es la contraseña por defecto del operador
        let password_hash = hash("12345", DEFAULT_COST)?;
        sqlx::query(
            "INSERT INTO usuarios (nombre_usuario, nombre_mostrado, hash_contrasena, rol, color_identificador, telefono_contacto) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind("operador_pyes_s")
        .bind("Operador PyEs S")
        .bind(password_hash)
        .bind("Operador")
        .bind("#4979b9ff")
        .execute(pool)
        .await?;
        info!("Usuario 'operador_pyes_s' ha sido creado");
    }
    Ok(())
}

// inicializar grupos de ejemplo si no existen
pub async fn init_groups(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // checar si existen grupos
    let count: i64 = sqlx::query("SELECT count(*) FROM grupos")
        .fetch_one(pool)
        .await?
        .get(0);
    // si no hay grupos, crear algunos de ejemplo
    if count == 0 {
        let groups = vec![
            (
                "5APM",
                "Programacion",
                "Grupo quinto de programación turno matuto",
            ),
            (
                "5AEM",
                "Electricidad",
                "Grupo quinto de electricidad turno matuto",
            ),
        ];
        // for para iterar en cada grupo y crearlo
        for (nomenclature, major, description) in groups {
            sqlx::query(
                "INSERT INTO grupos (id_nomenclatura, especialidad, descripcion) VALUES (?, ?, ?)",
            )
            .bind(nomenclature)
            .bind(major)
            .bind(description)
            .execute(pool)
            .await?;
            info!("Grupo '{}' creado", nomenclature);
        }
        info!("Grupos creados exitosamente");
    }
    Ok(())
}

// inicializar docentes de prueba si no existen
pub async fn init_teachers(pool: &Pool<Sqlite>) -> Result<(), Box<dyn std::error::Error>> {
    // buscar maestros existentes
    let count: i64 = sqlx::query("SELECT count(*) FROM usuarios WHERE rol = 'Docente'")
        .fetch_one(pool)
        .await?
        .get(0);
    // si no hay maestros, crear algunos de prueba
    if count == 0 {
        let teachers = vec![
            (
                "prof.lizdy",
                "Lizdy Cruz",
                "12345",
                "Docente",
                "#f63bf6ff",
                "+52 645 987 6543",
            ),
            (
                "prof.alonso",
                "Luis Morales",
                "12345",
                "Docente",
                "#10b910ff",
                "+52 645 123 4567",
            ),
        ];
        // para contar cuantos maestros se crean
        let teacher_count = teachers.len();
        // iterar la lista y crear cada maestro
        for (username, display_name, password, role, color, phone_number) in teachers {
            // crear el hash de la contraseña
            let password_hash = hash(password, DEFAULT_COST)?;
            // insertar el maestro en la base de datos
            sqlx::query(
                "INSERT INTO usuarios (nombre_usuario, nombre_mostrado, hash_contrasena, rol, color_identificador, telefono_contacto) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(username)
            .bind(display_name)
            .bind(password_hash)
            .bind(role)
            .bind(color)
            .bind(phone_number)
            .execute(pool)
            .await?;
            info!("Docente '{}' creado", display_name);
        }
        info!("{} profesores creados", teacher_count);
    }
    Ok(())
}

// inicializar estudiantes de prueba si no existen
pub async fn init_students(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // checar si existen estudiantes
    let count: i64 = sqlx::query("SELECT count(*) FROM estudiantes")
        .fetch_one(pool)
        .await?
        .get(0);
    // si no hay estudiantes, crear algunos de prueba
    if count == 0 {
        // lista de estudiantes de prueba
        let students = vec![
            (
                "2765432101",
                "Diego Alejandro",
                "Ramírez",
                "Castañeda",
                "2008-02-15",
                "Electricidad",
                "5AEM",
                "O+",
                "",
                "",
                "Calle Falsa 123, Ciudad, Estado",
                "+52 645 123 4567",
                "+52 645 765 4321",
                "+52 645 234 5678",
                "+52 645 345 6789",
                Some("19014AB8"), // Card UID
            ),
            (
                "2765432102",
                "María Fernanda",
                "López",
                "Armenta",
                "2008-05-20",
                "Programacion",
                "5APM",
                "A+",
                "",
                "",
                "Calle Verdadera 456, Ciudad, Estado",
                "+52 645 234 5678",
                "+52 645 876 5432",
                "+52 645 345 6789",
                "+52 645 456 7890",
                None,
            ),
        ];

        // contar cuantos estudiantes se crean
        let student_count = students.len();
        // iterar la lista y crear cada estudiante
        for (
            id,
            names,
            paternal_last_name,
            maternal_last_name,
            birth_date,
            major,
            group,
            blood_type,
            allergies,
            chronic_diseases,
            domicile,
            personal_phone,
            primary_guardian_phone,
            secondary_guardian_phone,
            emergency_phone,
            card_uid,
        ) in students
        {
            sqlx::query(
                r#"
                INSERT INTO estudiantes 
                (
                    id_control_escolar, 
                    nombres, 
                    apellido_paterno, 
                    apellido_materno, 
                    fecha_nacimiento, 
                    especialidad, 
                    grupo, 
                    tipo_de_sangre, 
                    alergias, 
                    enfermedades_cronicas, 
                    domicilio,
                    telefono_personal, 
                    telefono_tutor_principal, 
                    telefono_tutor_secundario, 
                    telefono_emergencia,
                    card_uid
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(id)
            .bind(names)
            .bind(paternal_last_name)
            .bind(maternal_last_name)
            .bind(birth_date)
            .bind(major)
            .bind(group)
            .bind(blood_type)
            .bind(allergies)
            .bind(chronic_diseases)
            .bind(domicile)
            .bind(personal_phone)
            .bind(primary_guardian_phone)
            .bind(secondary_guardian_phone)
            .bind(emergency_phone)
            .bind(card_uid)
            .execute(pool)
            .await?;
            info!("Estudiante '{}' creado", names);
        }
        info!("{} estudiantes falsos inicializados.", student_count);
    }

    Ok(())
}
