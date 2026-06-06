import { useEffect, useState, useCallback } from 'react';
import {
    Car,
    CheckCircle,
    ChevronRight,
    Edit3,
    Grid,
    RefreshCw,
    Save,
    Tent,
    Trash2,
    X,
} from 'lucide-react';
import { api } from '../lib/api';
import type { EmployeeSummary, JobSummary, Service } from '../types';

const STATUSES = ['Pending', 'In Progress', 'Completed'] as const;
type ActiveStatus = typeof STATUSES[number];
type JobCategory = 'Car' | 'Carpet' | 'Tent';

const STATUS_STYLE: Record<ActiveStatus, { col: string; badge: string; btn: string }> = {
    'Pending': {
        col: 'bg-slate-50 border-slate-200',
        badge: 'bg-slate-100 text-slate-600',
        btn: 'border-blue-200 text-blue-700 hover:bg-blue-50',
    },
    'In Progress': {
        col: 'bg-blue-50 border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        btn: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    },
    'Completed': {
        col: 'bg-amber-50 border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        btn: 'border-green-200 text-green-700 hover:bg-green-50',
    },
};

const NEXT_STATUS: Record<ActiveStatus, ActiveStatus | 'Paid'> = {
    'Pending': 'In Progress',
    'In Progress': 'Completed',
    'Completed': 'Paid',
};

const NEXT_LABEL: Record<ActiveStatus, string> = {
    'Pending': 'Start Job',
    'In Progress': 'Mark Complete',
    'Completed': 'Checkout',
};

const VEHICLE_TYPES: Record<JobCategory, string[]> = {
    Car: ['Sedan', 'SUV', 'Pickup', 'Van', 'Matatu', 'Truck', 'Other'],
    Carpet: ['Small (up to 4x6)', 'Medium (5x8)', 'Large (8x10)', 'Extra Large', 'Runner', 'Other'],
    Tent: ['Small (2-man)', 'Medium (Family)', 'Large (Event)', 'Gazebo', 'Other'],
};

function fmtDate(iso: string) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    let h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${dd}/${mm} ${h}:${min} ${ampm}`;
}

function categoryIcon(category: string) {
    return category === 'Carpet' ? Grid : category === 'Tent' ? Tent : Car;
}

function JobCard({
    job,
    onAdvance,
    onEdit,
    onDelete,
}: {
    job: JobSummary;
    onAdvance: (id: number, next: string) => void;
    onEdit: (job: JobSummary) => void;
    onDelete: (job: JobSummary) => void;
}) {
    const st = job.status as ActiveStatus;
    const styles = STATUS_STYLE[st];
    const next = NEXT_STATUS[st];
    const Icon = categoryIcon(job.category);

    return (
        <div className={`border rounded-2xl p-4 space-y-3 ${styles.col} hover:shadow-sm transition-shadow`}>
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="font-mono font-bold text-lg text-slate-800 truncate">{job.vehicle_plate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onEdit(job)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-white rounded-lg transition-colors"
                        title="Edit job"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(job)}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-white rounded-lg transition-colors"
                        title="Delete job"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles.badge}`}>{job.status}</span>
                </div>
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{job.vehicle_type}</p>
                <p className="text-sm text-slate-600 mt-1">{job.services.join(' · ')}</p>
                {job.attendants.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">Attendants: {job.attendants.join(', ')}</p>
                )}
            </div>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs text-slate-400">{fmtDate(job.created_at)}</p>
                    <p className="font-bold text-slate-800">KES {job.total_price.toLocaleString()}</p>
                </div>
                <button
                    onClick={() => onAdvance(job.id, next)}
                    className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${styles.btn}`}
                >
                    {NEXT_LABEL[st]} <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

function EditJobModal({
    job,
    services,
    employees,
    saving,
    onClose,
    onSave,
}: {
    job: JobSummary;
    services: Service[];
    employees: EmployeeSummary[];
    saving: boolean;
    onClose: () => void;
    onSave: (data: {
        plate: string;
        vehicleType: string;
        category: JobCategory;
        serviceIds: number[];
        attendantIds: number[];
        servicePrices: number[];
    }) => void;
}) {
    const initialCategory = (['Car', 'Carpet', 'Tent'].includes(job.category) ? job.category : 'Car') as JobCategory;
    const [category, setCategory] = useState<JobCategory>(initialCategory);
    const [plate, setPlate] = useState(job.vehicle_plate);
    const [vehicleType, setVehicleType] = useState(job.vehicle_type);
    const [selectedServices, setSelectedServices] = useState<number[]>(job.service_ids);
    const [selectedAttendants, setSelectedAttendants] = useState<number[]>(job.attendant_ids);
    const activeEmployees = employees.filter((emp) => emp.status === 'active' || selectedAttendants.includes(emp.id));

    const toggleService = (id: number) =>
        setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const toggleAttendant = (id: number) =>
        setSelectedAttendants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const totalPrice = selectedServices.reduce((sum, sId) => {
        const service = services.find((s) => s.id === sId);
        return sum + (service?.base_price ?? 0);
    }, 0);

    const handleSave = () => {
        const servicePrices = selectedServices.map((id) => services.find((s) => s.id === id)?.base_price ?? 0);
        onSave({ plate, vehicleType, category, serviceIds: selectedServices, attendantIds: selectedAttendants, servicePrices });
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Edit Job</h2>
                        <p className="text-sm text-slate-500">#{job.id} · {job.status}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(90vh-145px)] space-y-5">
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-fit">
                        {(['Car', 'Carpet', 'Tent'] as const).map((cat) => {
                            const CatIcon = categoryIcon(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setCategory(cat);
                                        if (!VEHICLE_TYPES[cat].includes(vehicleType)) {
                                            setVehicleType(VEHICLE_TYPES[cat][0]);
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                        category === cat ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <CatIcon className="w-4 h-4" />
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-slate-600">
                                {category === 'Car' ? 'Plate Number' : 'Reference / Tag ID'}
                            </span>
                            <input
                                value={plate}
                                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                className="w-full uppercase tracking-widest px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none font-mono text-lg"
                            />
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-slate-600">
                                {category === 'Car' ? 'Vehicle Type' : `${category} Size/Type`}
                            </span>
                            <select
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                            >
                                {VEHICLE_TYPES[category].map((type) => (
                                    <option key={type}>{type}</option>
                                ))}
                                {!VEHICLE_TYPES[category].includes(vehicleType) && <option>{vehicleType}</option>}
                            </select>
                        </label>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Services</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services.map((service) => {
                                const selected = selectedServices.includes(service.id);
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => toggleService(service.id)}
                                        className={`flex items-center p-3 border-2 rounded-xl text-left transition-all ${
                                            selected ? 'border-accent bg-yellow-50' : 'border-slate-200 hover:border-accent/40 bg-white'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{service.name}</p>
                                            <p className="text-accent font-bold text-sm mt-0.5">KES {service.base_price.toLocaleString()}</p>
                                        </div>
                                        {selected && <CheckCircle className="w-5 h-5 text-accent shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Attendants</h3>
                        {activeEmployees.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No active staff found.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {activeEmployees.map((employee) => {
                                    const selected = selectedAttendants.includes(employee.id);
                                    return (
                                        <label
                                            key={employee.id}
                                            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                                                selected ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() => toggleAttendant(employee.id)}
                                                className="w-4 h-4 accent-slate-800"
                                            />
                                            <span className="ml-3 font-medium text-slate-700">{employee.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
                    <p className="font-bold text-slate-800">KES {totalPrice.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !plate.trim() || selectedServices.length === 0}
                            className="flex items-center gap-2 bg-accent hover:bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ActiveJobs() {
    const [jobs, setJobs] = useState<JobSummary[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
    const [editingJob, setEditingJob] = useState<JobSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(''), 2500);
    };

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([api.getJobs(), api.getServices(), api.getEmployees()])
            .then(([jobList, serviceList, employeeList]) => {
                setJobs(jobList.filter((x) => x.status !== 'Paid'));
                setServices(serviceList);
                setEmployees(employeeList);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const advance = async (jobId: number, next: string) => {
        if (next === 'Paid') {
            window.dispatchEvent(new CustomEvent('goto-checkout', { detail: jobId }));
            return;
        }
        await api.updateJobStatus(jobId, next).catch(() => showToast('Could not update job status.'));
        load();
    };

    const saveJob = async (data: {
        plate: string;
        vehicleType: string;
        category: JobCategory;
        serviceIds: number[];
        attendantIds: number[];
        servicePrices: number[];
    }) => {
        if (!editingJob) return;

        setSaving(true);
        try {
            await api.updateJob(
                editingJob.id,
                editingJob.vehicle_id,
                data.plate,
                data.vehicleType,
                data.category,
                data.serviceIds,
                data.attendantIds,
                data.servicePrices,
            );
            setEditingJob(null);
            showToast('Job updated.');
            load();
        } catch (e: unknown) {
            showToast(`Error: ${e}`);
        } finally {
            setSaving(false);
        }
    };

    const deleteJob = async (job: JobSummary) => {
        const confirmed = window.confirm(`Delete job #${job.id} for ${job.vehicle_plate}?`);
        if (!confirmed) return;

        try {
            await api.deleteJob(job.id);
            showToast('Job deleted.');
            load();
        } catch (e: unknown) {
            showToast(`Error: ${e}`);
        }
    };

    const grouped = STATUSES.reduce<Record<ActiveStatus, JobSummary[]>>(
        (acc, s) => {
            acc[s] = jobs.filter((j) => j.status === s);
            return acc;
        },
        { Pending: [], 'In Progress': [], Completed: [] },
    );

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
                    toast.startsWith('Error') || toast.startsWith('Could not') ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
                }`}>
                    {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Job Board</h1>
                    <p className="text-slate-500 mt-1">Kazi zinazoendelea (Active jobs)</p>
                </div>
                <button
                    onClick={load}
                    className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {STATUSES.map((status) => (
                    <div key={status}>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="font-semibold text-slate-700">{status}</h2>
                            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {grouped[status].length}
                            </span>
                        </div>
                        <div className="space-y-3 min-h-[120px]">
                            {grouped[status].length === 0 ? (
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm">
                                    <Car className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                    No jobs
                                </div>
                            ) : (
                                grouped[status].map((job) => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onAdvance={advance}
                                        onEdit={setEditingJob}
                                        onDelete={deleteJob}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {editingJob && (
                <EditJobModal
                    job={editingJob}
                    services={services}
                    employees={employees}
                    saving={saving}
                    onClose={() => setEditingJob(null)}
                    onSave={saveJob}
                />
            )}
        </div>
    );
}
