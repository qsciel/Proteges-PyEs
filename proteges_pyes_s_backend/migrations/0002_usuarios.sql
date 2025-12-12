CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_usuario      TEXT NOT NULL UNIQUE,
    nombre_mostrado     TEXT NOT NULL,
    hash_contrasena     TEXT NOT NULL,
    rol                 TEXT NOT NULL,
    color_identificador TEXT,
    telefono_contacto   TEXT
);