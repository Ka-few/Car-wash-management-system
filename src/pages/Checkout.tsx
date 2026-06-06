import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Smartphone, Banknote, CheckCircle2, Car, Printer, X } from 'lucide-react';
import { api } from '../lib/api';
import { pdfGen } from '../lib/pdf';
import type { JobSummary } from '../types';

const METHODS = [
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'M-Pesa', label: 'M-Pesa', icon: Smartphone },
    { id: 'Card', label: 'Card', icon: CreditCard },
] as const;

function fmtDate(iso: string) {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    let h = d.getHours(); const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${dd}/${mm}/${yyyy} ${h}:${min} ${ampm}`;
}

export function Checkout({ preSelectedJobId }: { preSelectedJobId?: number }) {
    const [jobs, setJobs] = useState<JobSummary[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
    const [method, setMethod] = useState<'Cash' | 'M-Pesa' | 'Card'>('Cash');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');
    const [showReceiptPopup, setShowReceiptPopup] = useState(false);

    const load = useCallback(() => {
        api.getJobs()
            .then((j) => {
                const completedJobs = j.filter((x) => x.status === 'Completed');
                setJobs(completedJobs);
                if (preSelectedJobId) {
                    const pre = completedJobs.find((j) => j.id === preSelectedJobId);
                    if (pre) setSelectedJob(pre);
                }
            })
            .catch(() => { });
    }, [preSelectedJobId]);

    useEffect(() => { load(); }, [load]);

    const handlePayment = async () => {
        if (!selectedJob) return;
        setLoading(true);
        try {
            await api.processPayment(selectedJob.id, selectedJob.total_price, method);
            await pdfGen.generateReceipt(selectedJob, method);
            setToast(`Payment of KES ${selectedJob.total_price.toLocaleString()} recorded!`);
            setSelectedJob(null);
            load();
        } catch (e) {
            setToast(`Error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    const commission = selectedJob ? selectedJob.total_price * 0.3 : 0;

    return (
        <div className="space-y-6 max-w-5xl">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.startsWith('Error') ? 'bg-red-500' : 'bg-green-600'} text-white`}>
                    {toast}
                    <button onClick={() => setToast('')} className="ml-4 opacity-70">✕</button>
                </div>
            )}
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Checkout (Lipa)</h1>
                <p className="text-slate-500 mt-1">Kamilisha malipo ya kazi zilizokamilika.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="font-semibold text-slate-800">Completed Jobs ({jobs.length})</h2>
                    </div>
                    {jobs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No completed jobs awaiting payment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                            {jobs.map((job) => {
                                const pctColor = 'text-amber-600';
                                const isSelected = selectedJob?.id === job.id;
                                return (
                                    <button
                                        key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-amber-50 border-l-4 border-accent' : ''}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold font-mono text-slate-800">{job.vehicle_plate}</span>
                                            <span className={`font-semibold ${pctColor}`}>KES {job.total_price.toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">{job.services.join(' · ')}</p>
                                        <p className="text-xs text-slate-400 mt-1">{fmtDate(job.created_at)}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Payment panel */}
                <div>
                    {selectedJob ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selectedJob.vehicle_plate}</h2>
                                <p className="text-slate-500 text-sm">{selectedJob.vehicle_type} — {fmtDate(selectedJob.created_at)}</p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                {selectedJob.services.map((svc, i) => (
                                    <div key={i} className="flex justify-between text-sm text-slate-600">
                                        <span>{svc}</span>
                                    </div>
                                ))}
                                <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                                    <span>Total</span>
                                    <span className="text-xl text-accent">KES {selectedJob.total_price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm space-y-1">
                                <p className="font-semibold text-green-800">Commission Breakdown (30%)</p>
                                <p className="text-green-700">Total commission: <span className="font-bold">KES {commission.toFixed(0)}</span></p>
                                {selectedJob.attendants.length > 0 && (
                                    <p className="text-green-700">
                                        Per attendant ({selectedJob.attendants.join(', ')}):&nbsp;
                                        <span className="font-bold">KES {(commission / selectedJob.attendants.length).toFixed(0)}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">Payment Method (Njia ya Kulipa)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {METHODS.map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            onClick={() => setMethod(id)}
                                            className={`flex flex-col items-center p-3 border-2 rounded-xl transition-all ${method === id ? 'border-accent bg-yellow-50 text-accent' : 'border-slate-200 text-slate-600 hover:border-accent/40'}`}
                                        >
                                            <Icon className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full bg-accent hover:bg-yellow-500 text-white py-3.5 rounded-xl font-bold text-lg shadow hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {loading ? 'Processing...' : `Confirm Payment — KES ${selectedJob.total_price.toLocaleString()}`}
                            </button>

                            <button
                                onClick={() => setShowReceiptPopup(true)}
                                className="w-full border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                                <Printer className="w-4 h-4" /> Print Receipt
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                            <CreditCard className="w-10 h-10 mb-3 opacity-30" />
                            <p className="font-medium">Select a job to process payment</p>
                            <p className="text-sm mt-1">Chagua kazi ili kulipa</p>
                        </div>
                    )}
                </div>
            </div>

            {showReceiptPopup && selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800">Receipt Preview</h2>
                                    <p className="text-xs text-slate-500">Receipt #{selectedJob.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReceiptPopup(false)}
                                className="h-9 w-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center"
                                aria-label="Close receipt popup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                <div className="text-center border-b border-slate-200 pb-3">
                                    <p className="text-lg font-black text-slate-800">SAFIAUTO WASH</p>
                                    <p className="text-xs text-slate-500">Clean. Professional. Fast.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-400">Vehicle</p>
                                        <p className="font-bold text-slate-800">{selectedJob.vehicle_plate}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Payment</p>
                                        <p className="font-bold text-slate-800">{method}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-400">Date</p>
                                        <p className="font-medium text-slate-700">{fmtDate(selectedJob.created_at)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-400">Attendant</p>
                                        <p className="font-bold text-slate-800">{selectedJob.attendants.join(', ') || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200 pt-3 space-y-2">
                                    {selectedJob.services.map((service, index) => (
                                        <div key={`${service}-${index}`} className="text-sm text-slate-600">
                                            {service}
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                                    <span className="font-bold text-slate-800">Total</span>
                                    <span className="text-xl font-black text-accent">KES {selectedJob.total_price.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    console.log('Print Receipt clicked');
                                    await pdfGen.generateReceipt(selectedJob, method);
                                    setShowReceiptPopup(false);
                                }}
                                className="w-full bg-accent hover:bg-yellow-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Printer className="w-5 h-5" /> Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
