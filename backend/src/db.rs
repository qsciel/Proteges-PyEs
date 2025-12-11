use bcrypt::{DEFAULT_COST, hash};
use sqlx::{Pool, Row, Sqlite};

pub async fn init(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS alumnos (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            apellido_paterno TEXT NOT NULL,
            apellido_materno TEXT NOT NULL,
            fecha_nacimiento DATE NOT NULL,
            tipo_de_sangre CHAR(2) NOT NULL,
            alergias TEXT,
            enfermedades_cronicas TEXT,
            numero_telefono TEXT,
            numero_tutor TEXT,
            grupo TEXT
        );
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            color TEXT,
            nombre TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            scan_type TEXT NOT NULL,
            FOREIGN KEY(student_id) REFERENCES alumnos(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT
        );
        CREATE TABLE IF NOT EXISTS emergency_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            active BOOLEAN NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            triggered_by INTEGER NOT NULL,
            FOREIGN KEY(triggered_by) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn init_admin_user(pool: &Pool<Sqlite>) -> Result<(), Box<dyn std::error::Error>> {
    let count: i64 = sqlx::query("SELECT count(*) FROM users WHERE username = 'admin'")
        .fetch_one(pool)
        .await?
        .get(0);

    if count == 0 {
        let password_hash = hash("12345", DEFAULT_COST)?;
        sqlx::query(
            "INSERT INTO users (username, password_hash, role, color, nombre) VALUES (?, ?, ?, ?, ?)"
        )
        .bind("admin")
        .bind(password_hash)
        .bind("Operator")
        .bind("#FF0000")
        .bind("Super Admin")
        .execute(pool)
        .await?;
        println!("[*] Admin user created.");
    }
    Ok(())
}

pub async fn init_fake_groups(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    let count: i64 = sqlx::query("SELECT count(*) FROM groups")
        .fetch_one(pool)
        .await?
        .get(0);

    if count == 0 {
        let groups = vec![
            ("1A", "First grade, section A"),
            ("1B", "First grade, section B"),
            ("1C", "First grade, section C"),
        ];

        for (name, desc) in groups {
            sqlx::query("INSERT INTO groups (name, description) VALUES (?, ?)")
                .bind(name)
                .bind(desc)
                .execute(pool)
                .await?;
        }
        println!("[*] Grupos falsos inicializados.");
    }
    Ok(())
}

pub async fn init_fake_teachers(pool: &Pool<Sqlite>) -> Result<(), Box<dyn std::error::Error>> {
    let count: i64 = sqlx::query("SELECT count(*) FROM users WHERE role = 'Teacher'")
        .fetch_one(pool)
        .await?
        .get(0);

    if count == 0 {
        let teachers = vec![
            ("prof.maria", "12345", "#10B981", "Prof. María García"), // Green
            ("prof.juan", "12345", "#3B82F6", "Prof. Juan López"),    // Blue
            ("prof.ana", "12345", "#F59E0B", "Prof. Ana Martínez"),   // Amber
            ("prof.carlos", "12345", "#8B5CF6", "Prof. Carlos Rodríguez"), // Purple
            ("prof.laura", "12345", "#EC4899", "Prof. Laura Hernández"), // Pink
        ];

        let teacher_count = teachers.len();
        for (username, password, color, nombre) in teachers {
            let password_hash = hash(password, DEFAULT_COST)?;
            sqlx::query(
                "INSERT INTO users (username, password_hash, role, color, nombre) VALUES (?, ?, ?, ?, ?)"
            )
            .bind(username)
            .bind(password_hash)
            .bind("Teacher")
            .bind(color)
            .bind(nombre)
            .execute(pool)
            .await?;
        }
        println!("[*] {} profesores de prueba creados.", teacher_count);
    }
    Ok(())
}

pub async fn init_fake_students(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    let count: i64 = sqlx::query("SELECT count(*) FROM alumnos")
        .fetch_one(pool)
        .await?
        .get(0);

    if count == 0 {
        let students = vec![
            (
                "2765432101",
                "Diego Alejandro",
                "Ramírez",
                "Castañeda",
                "2008-02-15",
                "O+",
                None,
                None,
                "5AEM",
            ),
            (
                "2765432102",
                "María Fernanda",
                "López",
                "Armenta",
                "2008-05-20",
                "A+",
                None,
                None,
                "5APM",
            ),
            (
                "1003",
                "Ana Sofía",
                "Rodríguez",
                "Pérez",
                "2008-08-12",
                "B-",
                Some("Polen"),
                None,
                "1A",
            ),
            (
                "1004",
                "Ana",
                "Hernández",
                "González",
                "2008-03-25",
                "AB+",
                None,
                Some("Asma"),
                "1A",
            ),
            (
                "1005",
                "José",
                "López",
                "Sánchez",
                "2008-11-08",
                "O-",
                Some("Mariscos"),
                None,
                "1A",
            ),
            (
                "1006",
                "Laura",
                "Martínez",
                "Ramírez",
                "2008-07-14",
                "A-",
                None,
                None,
                "1A",
            ),
            (
                "1007",
                "Pedro",
                "González",
                "Flores",
                "2008-04-30",
                "B+",
                Some("Gluten"),
                Some("Diabetes"),
                "1A",
            ),
            (
                "2001",
                "Sofia",
                "Díaz",
                "Cruz",
                "2008-01-18",
                "O+",
                None,
                None,
                "1B",
            ),
            (
                "2002",
                "Diego",
                "Morales",
                "Jiménez",
                "2008-06-22",
                "A+",
                Some("Lactosa"),
                None,
                "1B",
            ),
            (
                "2003",
                "Valentina",
                "Ruiz",
                "Mendoza",
                "2008-09-05",
                "B-",
                None,
                Some("Epilepsia"),
                "1B",
            ),
            (
                "2004",
                "Miguel",
                "Castro",
                "Ortiz",
                "2008-12-11",
                "AB-",
                Some("Huevos"),
                None,
                "1B",
            ),
            (
                "2005",
                "Isabella",
                "Vargas",
                "Reyes",
                "2008-02-28",
                "O-",
                None,
                None,
                "1B",
            ),
            (
                "2006",
                "Andrés",
                "Romero",
                "Silva",
                "2008-10-16",
                "A-",
                Some("Penicilina"),
                Some("Anemia"),
                "1B",
            ),
            (
                "2007",
                "Camila",
                "Torres",
                "Moreno",
                "2008-05-07",
                "B+",
                None,
                None,
                "1B",
            ),
            (
                "3001",
                "Daniel",
                "Jiménez",
                "Herrera",
                "2008-03-19",
                "O+",
                Some("Soya"),
                None,
                "1C",
            ),
            (
                "3002",
                "Emma",
                "Gutiérrez",
                "Medina",
                "2008-08-23",
                "A+",
                None,
                Some("Cardiopatía"),
                "1C",
            ),
            (
                "3003",
                "Mateo",
                "Ramírez",
                "Aguilar",
                "2008-11-30",
                "B-",
                Some("Ácaros"),
                None,
                "1C",
            ),
            (
                "3004",
                "Lucía",
                "Flores",
                "Vega",
                "2008-04-14",
                "AB+",
                None,
                None,
                "1C",
            ),
            (
                "3005",
                "Santiago",
                "Mendoza",
                "Rojas",
                "2008-07-26",
                "O-",
                Some("Picaduras"),
                Some("TDAH"),
                "1C",
            ),
            (
                "3006",
                "Mia",
                "Sánchez",
                "Navarro",
                "2008-01-09",
                "A-",
                None,
                None,
                "1C",
            ),
            (
                "3007",
                "Sebastián",
                "Cruz",
                "Domínguez",
                "2008-06-03",
                "B+",
                Some("Frutos secos"),
                None,
                "1C",
            ),
        ];

        let student_count = students.len();
        for (id, nombre, ap_pat, ap_mat, fecha, sangre, alergias, enfermedades, grupo) in students {
            sqlx::query(
                r#"
                INSERT INTO alumnos 
                (id, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, tipo_de_sangre, alergias, enfermedades_cronicas, numero_telefono, numero_tutor, grupo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                "#
            )
            .bind(id)
            .bind(nombre)
            .bind(ap_pat)
            .bind(ap_mat)
            .bind(fecha)
            .bind(sangre)
            .bind(alergias)
            .bind(enfermedades)
            .bind(format!("+52 645 {}", &id[1..]))
            .bind(format!("+52 645 9{}", &id[1..]))
            .bind(grupo)
            .execute(pool)
            .await?;
        }

        println!("[*] {} estudiantes falsos inicializados.", student_count);
    }

    Ok(())
}
