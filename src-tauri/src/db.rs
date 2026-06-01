use rusqlite::{Connection, Result};
use tauri::Manager;

pub fn initialize_database(app_handle: &tauri::AppHandle) -> Result<Connection, rusqlite::Error> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("The app data directory should exist.");
    std::fs::create_dir_all(&app_dir).expect("The app data directory should be created.");
    let sqlite_path = app_dir.join("safiauto_v1.sqlite");

    let conn = Connection::open(sqlite_path)?;

    // Enable WAL mode for performance
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;
        ",
    )?;

    // Create tables
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plate TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            owner_name TEXT,
            owner_phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            base_price REAL NOT NULL,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            category TEXT NOT NULL DEFAULT 'Car',
            status TEXT NOT NULL DEFAULT 'Pending',
            total_price REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            paid_at DATETIME,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        );

        CREATE TABLE IF NOT EXISTS job_services (
            job_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            price_at_time REAL NOT NULL,
            PRIMARY KEY (job_id, service_id),
            FOREIGN KEY (job_id) REFERENCES jobs(id),
            FOREIGN KEY (service_id) REFERENCES services(id)
        );

        CREATE TABLE IF NOT EXISTS job_attendants (
            job_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            commission_rate REAL NOT NULL,
            commission_amount REAL NOT NULL,
            PRIMARY KEY (job_id, employee_id),
            FOREIGN KEY (job_id) REFERENCES jobs(id),
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        );
        ",
    )?;

    // Initial seed data for services if empty
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM services", [], |row| row.get(0))?;
    if count == 0 {
        conn.execute_batch(
            "
            INSERT INTO services (name, base_price, description) VALUES ('Body Wash', 500, 'Exterior hand or machine wash');
            INSERT INTO services (name, base_price, description) VALUES ('Buffing', 3000, 'Paint polishing and shine restoration');
            INSERT INTO services (name, base_price, description) VALUES ('Watermark Removal', 1500, 'Chemical treatment for water spots');
            INSERT INTO services (name, base_price, description) VALUES ('Interior Wash', 800, 'Vacuuming and wipe-down of cabin');
            INSERT INTO services (name, base_price, description) VALUES ('Engine Wash', 1000, 'Degreasing and cleaning of engine bay');
            INSERT INTO services (name, base_price, description) VALUES ('Under Wash', 500, 'High-pressure wash of undercarriage');
            INSERT INTO services (name, base_price, description) VALUES ('Carpet Wash', 1200, 'Deep cleaning of floor mats and carpets');
            INSERT INTO services (name, base_price, description) VALUES ('Tent Wash', 2000, 'Large-scale canvas/tent fabric cleaning');
            "
        )?;
    }

    // Migration: Add category column to jobs if missing
    let has_category: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('jobs') WHERE name = 'category'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map(|count| count > 0)
        .unwrap_or(false);

    if !has_category {
        conn.execute(
            "ALTER TABLE jobs ADD COLUMN category TEXT NOT NULL DEFAULT 'Car'",
            [],
        )?;
    }

    Ok(conn)
}
