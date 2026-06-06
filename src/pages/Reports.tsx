import { useEffect, useState } from 'react';
import {
    FileText, Calendar, TrendingUp, Download, PieChart, Users, DollarSign, ArrowUpRight, Printer, X
} from 'lucide-react';
import { api } from '../lib/api';
import { pdfGen } from '../lib/pdf';
import type { FinanceReport, CommissionReport } from '../types';

export function Reports() {
    const [activeTab, setActiveTab] = useState<'finance' | 'commission'>('finance');
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [financeData, setFinanceData] = useState<FinanceReport | null>(null);
    const [commissionData, setCommissionData] = useState<CommissionReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [showReportPopup, setShowReportPopup] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'finance') {
                const data = await api.getFinanceReport(startDate, endDate);
                setFinanceData(data);
            } else {
                const data = await api.getCommissionReport(startDate, endDate);
                setCommissionData(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab, startDate, endDate]);

    const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);
    const reportTitle = activeTab === 'finance' ? 'Financial Performance Report' : 'Commission Payout Report';
    const activeData = activeTab === 'finance' ? financeData : commissionData;

    const handlePrintReport = async () => {
        if (activeTab === 'finance') {
            if (!financeData) { alert('No finance data loaded yet. Please click Refresh.'); return; }
            await pdfGen.generateFinanceReport(financeData, startDate, endDate);
        } else {
            if (!commissionData) { alert('No commission data loaded yet. Please click Refresh.'); return; }
            await pdfGen.generateCommissionReport(commissionData, startDate, endDate);
        }
        setShowReportPopup(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Business Reports</h1>
                    <p className="text-slate-500 mt-1">Uchambuzi wa mapato na utendaji (Performance Analytics)</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'finance' ? 'bg-accent text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <DollarSign className="w-4 h-4" /> Finances
                    </button>
                    <button
                        onClick={() => setActiveTab('commission')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'commission' ? 'bg-accent text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Users className="w-4 h-4" /> Commissions
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
                    />
                </div>
                <button
                    onClick={loadData}
                    className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                >
                    <TrendingUp className="w-4 h-4" /> Refresh
                </button>
                <button
                    disabled={loading}
                    onClick={() => {
                        console.log('Report popup clicked', { activeTab, hasFinance: !!financeData, hasComm: !!commissionData });
                        if (!activeData) { alert(`No ${activeTab} data loaded yet. Please click Refresh.`); return; }
                        setShowReportPopup(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <Download className="w-4 h-4" /> Export PDF
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400 animate-pulse">Loading report data...</div>
            ) : activeTab === 'finance' && financeData ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                            <h2 className="text-3xl font-extrabold text-slate-800">{fmt(financeData.total_revenue)}</h2>
                            <div className="flex items-center gap-1.5 mt-2 text-emerald-600 text-xs font-bold">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Period Total</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-medium text-slate-500 mb-1">Payment Methods</p>
                            <div className="space-y-2 mt-2">
                                {financeData.revenue_by_method.map(m => (
                                    <div key={m.method} className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-medium">{m.method}</span>
                                        <span className="text-slate-800 font-bold">{fmt(m.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-medium text-slate-500 mb-1">Category Split</p>
                            <div className="space-y-2 mt-2">
                                {financeData.revenue_by_category.map(c => (
                                    <div key={c.category} className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-medium">{c.category}</span>
                                        <span className="text-slate-800 font-bold">{fmt(c.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent" /> Daily Revenue Trend
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Revenue (KES)</th>
                                        <th className="px-6 py-3 text-right">Contribution</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {financeData.daily_revenue.map(d => (
                                        <tr key={d.date} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-600">{d.date}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{fmt(d.amount)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="w-24 bg-slate-100 h-2.5 rounded-full inline-block overflow-hidden mr-2">
                                                    <div
                                                        className="h-full bg-accent"
                                                        style={{ width: `${(d.amount / financeData.total_revenue) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500">
                                                    {Math.round((d.amount / financeData.total_revenue) * 100)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'commission' && commissionData ? (
                <div className="space-y-6">
                    <div className="bg-accent p-8 rounded-3xl text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <p className="text-white/80 font-medium mb-1">Total Commissions Payout</p>
                            <h2 className="text-4xl font-black">{fmt(commissionData.total_commission)}</h2>
                        </div>
                        <PieChart className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/10" />
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-accent" /> Staff Commission Performance
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3">Jobs Done</th>
                                        <th className="px-6 py-3">Total Earned</th>
                                        <th className="px-6 py-3 text-right">Avg / Job</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {commissionData.staff_breakdown.map(s => (
                                        <tr key={s.employee_name} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{s.employee_name}</td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-lg font-bold text-slate-600 text-sm inline-flex">
                                                        {s.job_count} jobs
                                                    </span>
                                                    <div className="space-y-1">
                                                        {s.jobs.map((job) => (
                                                            <div key={job.job_id} className="text-xs text-slate-500">
                                                                <span className="font-bold text-slate-700">#{job.job_id}</span>
                                                                {' - '}
                                                                <span>{job.date}</span>
                                                                {' - '}
                                                                <span>{job.vehicle_plate}</span>
                                                                {' - '}
                                                                <span>{job.services}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-emerald-600">{fmt(s.amount)}</td>
                                            <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                                {fmt(s.amount / (s.job_count || 1))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No data found for the selected period.</p>
                </div>
            )}

            {showReportPopup && activeData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800">{reportTitle}</h2>
                                    <p className="text-xs text-slate-500">{startDate} to {endDate}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportPopup(false)}
                                className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center"
                                aria-label="Close report popup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                {activeTab === 'finance' && financeData ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                            <span className="font-semibold text-slate-600">Total Revenue</span>
                                            <span className="text-2xl font-black text-slate-800">{fmt(financeData.total_revenue)}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-2">Daily Revenue</p>
                                            <div className="max-h-56 overflow-y-auto divide-y divide-slate-200">
                                                {financeData.daily_revenue.map((day) => (
                                                    <div key={day.date} className="flex justify-between py-2 text-sm">
                                                        <span className="text-slate-600">{day.date}</span>
                                                        <span className="font-bold text-slate-800">{fmt(day.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : commissionData ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                            <span className="font-semibold text-slate-600">Total Commissions</span>
                                            <span className="text-2xl font-black text-slate-800">{fmt(commissionData.total_commission)}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-2">Staff Breakdown</p>
                                            <div className="max-h-56 overflow-y-auto divide-y divide-slate-200">
                                                {commissionData.staff_breakdown.map((staff) => (
                                                    <div key={staff.employee_name} className="py-3 text-sm space-y-2">
                                                        <div className="grid grid-cols-[1fr_auto_auto] gap-4">
                                                            <span className="font-semibold text-slate-700">{staff.employee_name}</span>
                                                            <span className="text-slate-500">{staff.job_count} jobs</span>
                                                            <span className="font-bold text-slate-800">{fmt(staff.amount)}</span>
                                                        </div>
                                                        <div className="space-y-1 pl-3 border-l-2 border-slate-200">
                                                            {staff.jobs.map((job) => (
                                                                <div key={job.job_id} className="grid grid-cols-[auto_1fr_auto] gap-3 text-xs text-slate-500">
                                                                    <span className="font-bold text-slate-700">#{job.job_id}</span>
                                                                    <span>{job.date} - {job.vehicle_plate} - {job.services}</span>
                                                                    <span className="font-semibold text-slate-700">{fmt(job.amount)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <button
                                onClick={handlePrintReport}
                                className="w-full bg-accent hover:bg-yellow-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Printer className="w-5 h-5" /> Print Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
