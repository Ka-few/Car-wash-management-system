import { useEffect, useState, useCallback } from 'react';
import { Car, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { JobSummary } from '../types';

const STATUSES = ['Pending', 'In Progress', 'Completed'] as const;
type ActiveStatus = typeof STATUSES[number];

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
    'Completed': '→ Checkout',
};

function fmtDate(iso: string) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    let h = d.getHours(); const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${dd}/${mm} ${h}:${min} ${ampm}`;
}

function JobCard({ job, onAdvance }: { job: JobSummary; onAdvance: (id: number, next: string) => void }) {
    const st = job.status as ActiveStatus;
    const styles = STATUS_STYLE[st];
    const next = NEXT_STATUS[st];
    return (
        <div className={`border rounded-2xl p-4 space-y-3 ${styles.col} hover:shadow-sm transition-shadow`}>
            <div className="flex justify-between items-start">
                <span className="font-mono font-bold text-lg text-slate-800">{job.vehicle_plate}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles.badge}`}>{job.status}</span>
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{job.vehicle_type}</p>
                <p className="text-sm text-slate-600 mt-1">{job.services.join(' · ')}</p>
                {job.attendants.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">👤 {job.attendants.join(', ')}</p>
                )}
            </div>
            <div className="flex items-center justify-between">
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

export function ActiveJobs() {
    const [jobs, setJobs] = useState<JobSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        api.getJobs()
            .then((j) => setJobs(j.filter((x) => x.status !== 'Paid')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const advance = async (jobId: number, next: string) => {
        if (next === 'Paid') {
            // Redirect to checkout instead
            window.dispatchEvent(new CustomEvent('goto-checkout', { detail: jobId }));
            return;
        }
        await api.updateJobStatus(jobId, next).catch(() => { });
        load();
    };

    const grouped = STATUSES.reduce<Record<ActiveStatus, JobSummary[]>>(
        (acc, s) => { acc[s] = jobs.filter((j) => j.status === s); return acc; },
        { Pending: [], 'In Progress': [], Completed: [] }
    );

    return (
        <div className="space-y-6">
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
                                    <JobCard key={job.id} job={job} onAdvance={advance} />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
