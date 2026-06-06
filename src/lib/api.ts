import { invoke } from '@tauri-apps/api/core';
import type {
    Vehicle, Service, EmployeeSummary, JobSummary, DashboardStats, FinanceReport, CommissionReport
} from '../types';

export const api = {
    // Vehicles
    getVehicles: () => invoke<Vehicle[]>('get_vehicles'),
    createVehicle: (plate: string, vehicleType: string, ownerName?: string, ownerPhone?: string) =>
        invoke<number>('create_vehicle', { plate, vehicleType, ownerName, ownerPhone }),

    // Services
    getServices: () => invoke<Service[]>('get_services'),
    createService: (name: string, price: number, description?: string) =>
        invoke<number>('create_service', { name, price, description }),
    updateService: (id: number, name: string, price: number, description?: string) =>
        invoke<void>('update_service', { id, name, price, description }),

    // Employees
    getEmployees: () => invoke<EmployeeSummary[]>('get_employees'),
    createEmployee: (name: string, phone?: string) =>
        invoke<number>('create_employee', { name, phone }),
    updateEmployee: (id: number, name: string, phone: string | undefined, status: string) =>
        invoke<void>('update_employee', { id, name, phone, status }),

    // Jobs
    createJob: (vehicleId: number, category: string, serviceIds: number[], attendantIds: number[], servicePrices: number[]) =>
        invoke<number>('create_job', { vehicleId, category, serviceIds, attendantIds, servicePrices }),
    getJobs: () => invoke<JobSummary[]>('get_jobs'),
    updateJob: (
        jobId: number,
        vehicleId: number,
        plate: string,
        vehicleType: string,
        category: string,
        serviceIds: number[],
        attendantIds: number[],
        servicePrices: number[],
    ) =>
        invoke<void>('update_job', { jobId, vehicleId, plate, vehicleType, category, serviceIds, attendantIds, servicePrices }),
    updateJobStatus: (jobId: number, newStatus: string) =>
        invoke<void>('update_job_status', { jobId, newStatus }),
    deleteJob: (jobId: number) => invoke<void>('delete_job', { jobId }),

    // Payments
    processPayment: (jobId: number, amount: number, method: string) =>
        invoke<void>('process_payment', { jobId, amount, method }),

    // Dashboard
    getDashboardStats: () => invoke<DashboardStats>('get_dashboard_stats'),

    // Reports
    getFinanceReport: (startDate: string, endDate: string) =>
        invoke<FinanceReport>('get_finance_report', { startDate, endDate }),
    getCommissionReport: (startDate: string, endDate: string) =>
        invoke<CommissionReport>('get_commission_report', { startDate, endDate }),
};
