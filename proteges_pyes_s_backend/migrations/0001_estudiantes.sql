CREATE TABLE IF NOT EXISTS estudiantes (
    id_control_escolar        TEXT PRIMARY KEY,
    nombres                   TEXT NOT NULL,
    apellido_paterno          TEXT NOT NULL,
    apellido_materno          TEXT NOT NULL,
    fecha_nacimiento          DATE NOT NULL,
    especialidad              TEXT NOT NULL,
    grupo                     TEXT NOT NULL,
    tipo_de_sangre            CHAR(3),
    alergias                  TEXT,
    enfermedades_cronicas     TEXT,
    domicilio                 TEXT,
    telefono_personal         TEXT,
    telefono_tutor_principal  TEXT,
    telefono_tutor_secundario TEXT,
    telefono_emergencia       TEXT,
    FOREIGN KEY (grupo)       REFERENCES grupos(id_nomenclatura)
);