import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Edit2, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import type { EmployeeSummary } from '../types';

function EmployeeModal({
    initial,
    onSave,
    onClose,
}: {
    initial?: EmployeeSummary;
    onSave: (name: string, phone: string, status: string) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [phone, setPhone] = useState(initial?.phone ?? '');
    const [status, setStatus] = useState(initial?.status ?? 'active');

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                <h2 className="text-xl font-bold text-slate-800">
                    {initial ? 'Edit Employee' : 'Add Employee (Mhudumu Mpya)'}
                </h2>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Full Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jina kamili"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Phone (Optional)</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="07XX XXX XXX"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>
                    {initial && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-600">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { if (name.trim()) onSave(name, phone, status); }}
                        className="flex-1 px-4 py-2.5 bg-accent hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export function Employees() {
    const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState<EmployeeSummary | undefined>();
    const [toast, setToast] = useState('');

    const load = useCallback(() => {
        api.getEmployees().then(setEmployees).catch(() => { });
    }, []);

    useEffect(() => { load(); }, [load]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async (name: string, phone: string, status: string) => {
        if (editTarget) {
            await api.updateEmployee(editTarget.id, name, phone || undefined, status);
            showToast('Employee updated!');
        } else {
            await api.createEmployee(name, phone || undefined);
            showToast('Employee added!');
        }
        setShowModal(false);
        setEditTarget(undefined);
        load();
    };

    const filtered = employees.filter(
        (e) => filterStatus === 'all' || e.status === filterStatus
    );

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed top-4 right-4 z-50 px-5 py-3 bg-green-600 text-white rounded-xl shadow-lg text-sm font-medium">
                    {toast}
                </div>
            )}
            {showModal && (
                <EmployeeModal
                    initial={editTarget}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditTarget(undefined); }}
                />
            )}

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Staff Management</h1>
                    <p className="text-slate-500 mt-1">Usimamizi wa wafanyakazi</p>
                </div>
                <button
                    onClick={() => { setEditTarget(undefined); setShowModal(true); }}
                    className="flex items-center gap-2 bg-accent hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow transition-all active:scale-95"
                >
                    <UserPlus className="w-4 h-4" /> Add Staff
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['all', 'active', 'inactive'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filterStatus === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Staff', value: employees.length },
                    { label: 'Active', value: employees.filter((e) => e.status === 'active').length },
                    { label: 'Total Jobs Done', value: employees.reduce((s, e) => s + e.total_jobs, 0) },
                    { label: 'Total Commissions', value: `KES ${employees.reduce((s, e) => s + e.total_commission, 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}` },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Employee cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((emp) => (
                    <div key={emp.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xl">
                                    {emp.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{emp.name}</p>
                                    <p className="text-sm text-slate-500">{emp.phone ?? 'No phone'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {emp.status === 'active' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-slate-400" />
                                )}
                                <span className={`text-xs font-semibold ${emp.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                                    {emp.status}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                            <div>
                                <p className="text-xs text-slate-500">Jobs Done</p>
                                <p className="text-lg font-bold text-slate-800">{emp.total_jobs}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Commission</p>
                                <p className="text-lg font-bold text-accent flex items-center justify-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    KES {emp.total_commission.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setEditTarget(emp); setShowModal(true); }}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                    <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No staff members found. Add your first employee!</p>
                </div>
            )}
        </div>
    );
}
