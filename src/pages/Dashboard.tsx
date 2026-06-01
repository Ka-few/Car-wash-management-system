import { useEffect, useState } from 'react';
import {
    TrendingUp, Car, Clock, AlertCircle, DollarSign, Star
} from 'lucide-react';
import { api } from '../lib/api';
import type { DashboardStats, JobSummary } from '../types';

function fmt(n: number) {
    return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    let h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${dd}/${mm}/${yyyy} ${h}:${min} ${ampm}`;
}

const STATUS_COLOR: Record<string, string> = {
    Pending: 'bg-slate-100 text-slate-600',
    'In Progress': 'bg-blue-100 text-blue-700',
    Completed: 'bg-amber-100 text-amber-700',
    Paid: 'bg-green-100 text-green-700',
};

export function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [jobs, setJobs] = useState<JobSummary[]>([]);

    useEffect(() => {
        api.getDashboardStats().then(setStats).catch(() => { });
        api.getJobs().then(setJobs).catch(() => { });
    }, []);

    const unpaidJobs = jobs.filter((j) => j.status === 'Completed');
    const recentJobs = jobs.slice(0, 8);

    const statCards = [
        {
            label: "Leo's Revenue (Today)",
            value: stats ? fmt(stats.today_revenue) : '—',
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            label: 'Jobs Today',
            value: stats?.today_jobs ?? '—',
            icon: Car,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Active Jobs',
            value: stats?.pending_jobs ?? '—',
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            label: 'Awaiting Payment',
            value: stats?.unpaid_jobs ?? '—',
            icon: AlertCircle,
            color: 'text-red-500',
            bg: 'bg-red-50',
        },
        {
            label: 'Month Revenue',
            value: stats ? fmt(stats.month_revenue) : '—',
            icon: TrendingUp,
            color: 'text-primary',
            bg: 'bg-slate-100',
        },
        {
            label: 'Top Service Today',
            value: stats?.top_service ?? 'N/A',
            icon: Star,
            color: 'text-accent',
            bg: 'bg-amber-50',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                <p className="text-slate-500 mt-1">Karibu SafiAuto — hapa ni muhtasari wa leo.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
                        >
                            <div className={`${card.bg} p-3 rounded-xl`}>
                                <Icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 font-medium leading-snug">{card.label}</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1 truncate">{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Awaiting Payment Alert */}
            {unpaidJobs.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <h2 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5" />
                        Jobs Awaiting Payment ({unpaidJobs.length})
                    </h2>
                    <div className="space-y-2">
                        {unpaidJobs.map((j) => (
                            <div
                                key={j.id}
                                className="flex justify-between items-center bg-white border border-amber-100 rounded-xl px-4 py-2"
                            >
                                <span className="font-mono font-bold text-slate-700">{j.vehicle_plate}</span>
                                <span className="text-slate-500 text-sm">{j.services.join(', ')}</span>
                                <span className="font-semibold text-amber-700">{fmt(j.total_price)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Jobs */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">Recent Jobs</h2>
                </div>
                {recentJobs.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No jobs yet today</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {recentJobs.map((job) => (
                            <div key={job.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold font-mono text-slate-800">{job.vehicle_plate}</p>
                                    <p className="text-sm text-slate-500 truncate">{job.services.join(' · ')}</p>
                                </div>
                                <div className="hidden md:block text-sm text-slate-400">{fmtDate(job.created_at)}</div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[job.status]}`}>
                                    {job.status}
                                </span>
                                <span className="font-bold text-slate-700">{fmt(job.total_price)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
