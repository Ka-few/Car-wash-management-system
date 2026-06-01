import { invoke } from '@tauri-apps/api/core';
import type {
    Vehicle, Service, EmployeeSummary, JobSummary, DashboardStats
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
    createJob: (vehicleId: number, serviceIds: number[], attendantIds: number[], servicePrices: number[]) =>
        invoke<number>('create_job', { vehicleId, serviceIds, attendantIds, servicePrices }),
    getJobs: () => invoke<JobSummary[]>('get_jobs'),
    updateJobStatus: (jobId: number, newStatus: string) =>
        invoke<void>('update_job_status', { jobId, newStatus }),

    // Payments
    processPayment: (jobId: number, amount: number, method: string) =>
        invoke<void>('process_payment', { jobId, amount, method }),

    // Dashboard
    getDashboardStats: () => invoke<DashboardStats>('get_dashboard_stats'),
};
