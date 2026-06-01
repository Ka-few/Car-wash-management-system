// Shared TypeScript types matching backend DTOs

export interface Vehicle {
    id: number;
    plate: string;
    vehicle_type: string;
    owner_name?: string;
    owner_phone?: string;
    created_at: string;
}

export interface Service {
    id: number;
    name: string;
    base_price: number;
    description?: string;
}

export interface Employee {
    id: number;
    name: string;
    phone?: string;
    status: string;
    created_at: string;
}

export interface EmployeeSummary {
    id: number;
    name: string;
    phone?: string;
    status: string;
    total_jobs: number;
    total_commission: number;
}

export interface JobSummary {
    id: number;
    vehicle_plate: string;
    vehicle_type: string;
    category: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Paid';
    total_price: number;
    created_at: string;
    paid_at?: string;
    services: string[];
    attendants: string[];
}

export interface DashboardStats {
    today_revenue: number;
    today_jobs: number;
    pending_jobs: number;
    top_service: string;
    unpaid_jobs: number;
    month_revenue: number;
}

export interface FinanceReport {
    total_revenue: number;
    revenue_by_method: { method: string; amount: number }[];
    revenue_by_category: { category: string; amount: number }[];
    daily_revenue: { date: string; amount: number }[];
}

export interface CommissionReport {
    total_commission: number;
    staff_breakdown: {
        employee_id: number;
        employee_name: string;
        amount: number;
        job_count: number;
    }[];
}
