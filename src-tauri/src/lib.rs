pub mod commands;
pub mod db;

use commands::*;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let conn =
                db::initialize_database(app.handle()).expect("Failed to initialize database");
            app.manage(AppState {
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_vehicles,
            create_vehicle,
            get_services,
            create_service,
            update_service,
            get_employees,
            create_employee,
            update_employee,
            create_job,
            get_jobs,
            update_job_status,
            process_payment,
            get_dashboard_stats,
            get_finance_report,
            get_commission_report,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
