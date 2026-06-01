use crate::AppState;
use rusqlite::Result;
use serde::{Deserialize, Serialize};
use tauri::State;

// ─── DTOs ────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Vehicle {
    pub id: i64,
    pub plate: String,
    pub vehicle_type: String,
    pub owner_name: Option<String>,
    pub owner_phone: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Service {
    pub id: i64,
    pub name: String,
    pub base_price: f64,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub id: i64,
    pub name: String,
    pub phone: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobSummary {
    pub id: i64,
    pub vehicle_plate: String,
    pub vehicle_type: String,
    pub category: String,
    pub status: String,
    pub total_price: f64,
    pub created_at: String,
    pub paid_at: Option<String>,
    pub services: Vec<String>,
    pub attendants: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmployeeSummary {
    pub id: i64,
    pub name: String,
    pub phone: Option<String>,
    pub status: String,
    pub total_jobs: i64,
    pub total_commission: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardStats {
    pub today_revenue: f64,
    pub today_jobs: i64,
    pub pending_jobs: i64,
    pub top_service: String,
    pub unpaid_jobs: i64,
    pub month_revenue: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FinanceReport {
    pub total_revenue: f64,
    pub revenue_by_method: Vec<RevenueByMethod>,
    pub revenue_by_category: Vec<RevenueByCategory>,
    pub daily_revenue: Vec<DailyRevenue>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevenueByMethod {
    pub method: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RevenueByCategory {
    pub category: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DailyRevenue {
    pub date: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommissionReport {
    pub total_commission: f64,
    pub staff_breakdown: Vec<StaffCommission>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StaffCommission {
    pub employee_id: i64,
    pub employee_name: String,
    pub amount: f64,
    pub job_count: i64,
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_vehicles(db: State<AppState>) -> Result<Vec<Vehicle>, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, plate, type, owner_name, owner_phone, created_at FROM vehicles ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let vehicles = stmt
        .query_map([], |row| {
            Ok(Vehicle {
                id: row.get(0)?,
                plate: row.get(1)?,
                vehicle_type: row.get(2)?,
                owner_name: row.get(3)?,
                owner_phone: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|v| v.ok())
        .collect();
    Ok(vehicles)
}

#[tauri::command]
pub fn create_vehicle(
    db: State<AppState>,
    plate: String,
    vehicle_type: String,
    owner_name: Option<String>,
    owner_phone: Option<String>,
) -> Result<i64, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO vehicles (plate, type, owner_name, owner_phone) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![plate.to_uppercase(), vehicle_type, owner_name, owner_phone],
    )
    .map_err(|e| e.to_string())?;
    // Return id even if already exists
    let id: i64 = conn
        .query_row(
            "SELECT id FROM vehicles WHERE plate = ?1",
            rusqlite::params![plate.to_uppercase()],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(id)
}

// ─── Services ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_services(db: State<AppState>) -> Result<Vec<Service>, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, base_price, description FROM services ORDER BY name")
        .map_err(|e| e.to_string())?;
    let services = stmt
        .query_map([], |row| {
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                base_price: row.get(2)?,
                description: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|s| s.ok())
        .collect();
    Ok(services)
}

#[tauri::command]
pub fn update_service(
    db: State<AppState>,
    id: i64,
    name: String,
    price: f64,
    description: Option<String>,
) -> Result<(), String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE services SET name = ?1, base_price = ?2, description = ?3 WHERE id = ?4",
        rusqlite::params![name, price, description, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_service(
    db: State<AppState>,
    name: String,
    price: f64,
    description: Option<String>,
) -> Result<i64, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO services (name, base_price, description) VALUES (?1, ?2, ?3)",
        rusqlite::params![name, price, description],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

// ─── Employees ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_employees(db: State<AppState>) -> Result<Vec<EmployeeSummary>, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT e.id, e.name, e.phone, e.status,
                COUNT(ja.job_id) AS total_jobs,
                COALESCE(SUM(ja.commission_amount), 0) AS total_commission
         FROM employees e
         LEFT JOIN job_attendants ja ON ja.employee_id = e.id
         GROUP BY e.id
         ORDER BY e.name",
        )
        .map_err(|e| e.to_string())?;
    let employees = stmt
        .query_map([], |row| {
            Ok(EmployeeSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                status: row.get(3)?,
                total_jobs: row.get(4)?,
                total_commission: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();
    Ok(employees)
}

#[tauri::command]
pub fn create_employee(
    db: State<AppState>,
    name: String,
    phone: Option<String>,
) -> Result<i64, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO employees (name, phone) VALUES (?1, ?2)",
        rusqlite::params![name, phone],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_employee(
    db: State<AppState>,
    id: i64,
    name: String,
    phone: Option<String>,
    status: String,
) -> Result<(), String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE employees SET name = ?1, phone = ?2, status = ?3 WHERE id = ?4",
        rusqlite::params![name, phone, status, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn create_job(
    db: State<AppState>,
    vehicle_id: i64,
    category: String,
    service_ids: Vec<i64>,
    attendant_ids: Vec<i64>,
    service_prices: Vec<f64>,
) -> Result<i64, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;

    let total_price: f64 = service_prices.iter().sum();
    conn.execute(
        "INSERT INTO jobs (vehicle_id, category, status, total_price) VALUES (?1, ?2, 'Pending', ?3)",
        rusqlite::params![vehicle_id, category, total_price],
    )
    .map_err(|e| e.to_string())?;
    let job_id = conn.last_insert_rowid();

    // Insert job_services
    for (idx, &service_id) in service_ids.iter().enumerate() {
        let price = service_prices.get(idx).copied().unwrap_or(0.0);
        conn.execute(
            "INSERT OR IGNORE INTO job_services (job_id, service_id, price_at_time) VALUES (?1, ?2, ?3)",
            rusqlite::params![job_id, service_id, price],
        ).map_err(|e| e.to_string())?;
    }

    // Insert job_attendants with equal commission split
    if !attendant_ids.is_empty() {
        let commission_rate: f64 = 0.30;
        let split = attendant_ids.len() as f64;
        let commission_per_attendant = (total_price * commission_rate) / split;
        for &employee_id in &attendant_ids {
            conn.execute(
                "INSERT OR IGNORE INTO job_attendants (job_id, employee_id, commission_rate, commission_amount) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![job_id, employee_id, commission_rate, commission_per_attendant],
            ).map_err(|e| e.to_string())?;
        }
    }

    Ok(job_id)
}

#[tauri::command]
pub fn get_jobs(db: State<AppState>) -> Result<Vec<JobSummary>, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT j.id, v.plate, v.type, j.category, j.status, j.total_price, j.created_at, j.paid_at
         FROM jobs j JOIN vehicles v ON j.vehicle_id = v.id
         ORDER BY j.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let mut jobs: Vec<JobSummary> = stmt
        .query_map([], |row| {
            Ok(JobSummary {
                id: row.get(0)?,
                vehicle_plate: row.get(1)?,
                vehicle_type: row.get(2)?,
                category: row.get(3)?,
                status: row.get(4)?,
                total_price: row.get(5)?,
                created_at: row.get(6)?,
                paid_at: row.get(7)?,
                services: vec![],
                attendants: vec![],
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|j| j.ok())
        .collect();

    for job in &mut jobs {
        let mut svc_stmt = conn.prepare(
            "SELECT s.name FROM job_services js JOIN services s ON js.service_id = s.id WHERE js.job_id = ?1"
        ).map_err(|e| e.to_string())?;
        job.services = svc_stmt
            .query_map([job.id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut att_stmt = conn.prepare(
            "SELECT e.name FROM job_attendants ja JOIN employees e ON ja.employee_id = e.id WHERE ja.job_id = ?1"
        ).map_err(|e| e.to_string())?;
        job.attendants = att_stmt
            .query_map([job.id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
    }
    Ok(jobs)
}

#[tauri::command]
pub fn update_job_status(
    db: State<AppState>,
    job_id: i64,
    new_status: String,
) -> Result<(), String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE jobs SET status = ?1 WHERE id = ?2",
        rusqlite::params![new_status, job_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn process_payment(
    db: State<AppState>,
    job_id: i64,
    amount: f64,
    method: String,
) -> Result<(), String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO payments (job_id, amount, method) VALUES (?1, ?2, ?3)",
        rusqlite::params![job_id, amount, method],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE jobs SET status = 'Paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?1",
        rusqlite::params![job_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_dashboard_stats(db: State<AppState>) -> Result<DashboardStats, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;

    let today_revenue: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE DATE(recorded_at) = DATE('now')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let today_jobs: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM jobs WHERE DATE(created_at) = DATE('now')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let pending_jobs: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM jobs WHERE status IN ('Pending', 'In Progress')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let unpaid_jobs: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM jobs WHERE status = 'Completed'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let month_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE strftime('%Y-%m', recorded_at) = strftime('%Y-%m', 'now')",
        [], |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let top_service: String = conn
        .query_row(
            "SELECT s.name FROM job_services js JOIN services s ON js.service_id = s.id
         JOIN jobs j ON js.job_id = j.id WHERE DATE(j.created_at) = DATE('now')
         GROUP BY s.id ORDER BY COUNT(*) DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "N/A".to_string());

    Ok(DashboardStats {
        today_revenue,
        today_jobs,
        pending_jobs,
        top_service,
        unpaid_jobs,
        month_revenue,
    })
}

// ─── Reports ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_finance_report(
    db: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<FinanceReport, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;

    let total_revenue: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE DATE(recorded_at) BETWEEN ?1 AND ?2",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT method, SUM(amount) FROM payments 
             WHERE DATE(recorded_at) BETWEEN ?1 AND ?2 GROUP BY method",
        )
        .map_err(|e| e.to_string())?;
    let revenue_by_method = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(RevenueByMethod {
                method: row.get(0)?,
                amount: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt = conn
        .prepare(
            "SELECT j.category, SUM(p.amount) FROM payments p 
             JOIN jobs j ON p.job_id = j.id 
             WHERE DATE(p.recorded_at) BETWEEN ?1 AND ?2 GROUP BY j.category",
        )
        .map_err(|e| e.to_string())?;
    let revenue_by_category = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(RevenueByCategory {
                category: row.get(0)?,
                amount: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut stmt = conn
        .prepare(
            "SELECT DATE(recorded_at), SUM(amount) FROM payments 
             WHERE DATE(recorded_at) BETWEEN ?1 AND ?2 
             GROUP BY DATE(recorded_at) ORDER BY DATE(recorded_at) ASC",
        )
        .map_err(|e| e.to_string())?;
    let daily_revenue = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(DailyRevenue {
                date: row.get(0)?,
                amount: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(FinanceReport {
        total_revenue,
        revenue_by_method,
        revenue_by_category,
        daily_revenue,
    })
}

#[tauri::command]
pub fn get_commission_report(
    db: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<CommissionReport, String> {
    let conn = db.db.lock().map_err(|e| e.to_string())?;

    let total_commission: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(ja.commission_amount), 0) FROM job_attendants ja 
             JOIN jobs j ON ja.job_id = j.id 
             WHERE DATE(j.created_at) BETWEEN ?1 AND ?2",
            rusqlite::params![start_date, end_date],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT e.id, e.name, SUM(ja.commission_amount), COUNT(ja.job_id) 
             FROM job_attendants ja 
             JOIN employees e ON ja.employee_id = e.id 
             JOIN jobs j ON ja.job_id = j.id 
             WHERE DATE(j.created_at) BETWEEN ?1 AND ?2 
             GROUP BY e.id",
        )
        .map_err(|e| e.to_string())?;
    let staff_breakdown = stmt
        .query_map(rusqlite::params![start_date, end_date], |row| {
            Ok(StaffCommission {
                employee_id: row.get(0)?,
                employee_name: row.get(1)?,
                amount: row.get(2)?,
                job_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(CommissionReport {
        total_commission,
        staff_breakdown,
    })
}
