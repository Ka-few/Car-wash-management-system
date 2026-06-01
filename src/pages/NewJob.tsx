import { useEffect, useState } from 'react';
import { CheckCircle, User, Phone, Car, Grid, Tent } from 'lucide-react';
import { api } from '../lib/api';
import type { Service, EmployeeSummary } from '../types';
import { useAppStore } from '../store';

export function NewJob() {
    const [services, setServices] = useState<Service[]>([]);
    const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
    const [jobCategory, setJobCategory] = useState<'Car' | 'Carpet' | 'Tent'>('Car');
    const [plate, setPlate] = useState('');
    const [vehicleType, setVehicleType] = useState('Sedan');
    const [ownerName, setOwnerName] = useState('');
    const [ownerPhone, setOwnerPhone] = useState('');
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [selectedAttendants, setSelectedAttendants] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');
    const setRoute = useAppStore((s) => s.setRoute);

    useEffect(() => {
        api.getServices().then(setServices).catch(() => { });
        api.getEmployees()
            .then((e) => setEmployees(e.filter((emp) => emp.status === 'active')))
            .catch(() => { });
    }, []);

    const toggleService = (id: number) =>
        setSelectedServices((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const toggleAttendant = (id: number) =>
        setSelectedAttendants((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const totalPrice = selectedServices.reduce((sum, sId) => {
        const s = services.find((sv) => sv.id === sId);
        return sum + (s?.base_price ?? 0);
    }, 0);

    const handleSubmit = async () => {
        if (!plate.trim()) { setToast('Please enter a plate number.'); return; }
        if (selectedServices.length === 0) { setToast('Please select at least one service.'); return; }
        setLoading(true);
        try {
            const vehicleId = await api.createVehicle(plate, vehicleType, ownerName || undefined, ownerPhone || undefined);
            const serviceIds = selectedServices;
            const servicePrices = serviceIds.map((sId) => services.find((s) => s.id === sId)?.base_price ?? 0);
            await api.createJob(vehicleId, jobCategory, serviceIds, selectedAttendants, servicePrices);
            setToast('Job created successfully!');
            setTimeout(() => { setToast(''); setRoute('active_jobs'); }, 500);
        } catch (e: unknown) {
            setToast(`Error: ${e}`);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.startsWith('Error') ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
                    {toast}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">New Intake</h1>
                    <p className="text-slate-500 mt-1">Sajili kazi mpya (Register new job)</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-accent hover:bg-yellow-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Job'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Vehicle form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Car className="w-5 h-5 text-accent" /> {jobCategory} Information
                            </h2>
                            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                {(['Car', 'Carpet', 'Tent'] as const).map((cat) => {
                                    const CatIcon = cat === 'Carpet' ? Grid : cat === 'Tent' ? Tent : Car;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setJobCategory(cat)}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${jobCategory === cat ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <CatIcon className="w-4 h-4" />
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600">
                                    {jobCategory === 'Car' ? 'Plate Number *' : 'Reference / Tag ID *'}
                                </label>
                                <input
                                    type="text"
                                    value={plate}
                                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                    placeholder={jobCategory === 'Car' ? 'KCA 123G' : 'TAG-001'}
                                    className="w-full uppercase tracking-widest px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none font-mono text-lg"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600">
                                    {jobCategory === 'Car' ? 'Vehicle Type' : jobCategory + ' Size/Type'}
                                </label>
                                <select
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                                >
                                    {jobCategory === 'Car' ? (
                                        ['Sedan', 'SUV', 'Pickup', 'Van', 'Matatu', 'Truck', 'Other'].map((t) => (
                                            <option key={t}>{t}</option>
                                        ))
                                    ) : jobCategory === 'Carpet' ? (
                                        ['Small (up to 4x6)', 'Medium (5x8)', 'Large (8x10)', 'Extra Large', 'Runner', 'Other'].map((t) => (
                                            <option key={t}>{t}</option>
                                        ))
                                    ) : (
                                        ['Small (2-man)', 'Medium (Family)', 'Large (Event)', 'Gazebo', 'Other'].map((t) => (
                                            <option key={t}>{t}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Owner Name (Optional)</label>
                                <input
                                    type="text"
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Owner Phone (Optional)</label>
                                <input
                                    type="tel"
                                    value={ownerPhone}
                                    onChange={(e) => setOwnerPhone(e.target.value)}
                                    placeholder="07XX XXX XXX"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-5">Select Services (Huduma)</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services.map((s) => {
                                const sel = selectedServices.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => toggleService(s.id)}
                                        className={`flex items-center p-4 border-2 rounded-2xl text-left transition-all ${sel ? 'border-accent bg-yellow-50' : 'border-slate-200 hover:border-accent/40 bg-white'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800">{s.name}</p>
                                            <p className="text-accent font-bold mt-0.5">KES {s.base_price.toLocaleString()}</p>
                                        </div>
                                        {sel && <CheckCircle className="w-6 h-6 text-accent shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Attendants */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Assign Attendants (Wahudumu)</h2>
                        {employees.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No active staff found. Add employees first.</p>
                        ) : (
                            <div className="space-y-2">
                                {employees.map((emp) => {
                                    const sel = selectedAttendants.includes(emp.id);
                                    return (
                                        <label
                                            key={emp.id}
                                            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${sel ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={sel}
                                                onChange={() => toggleAttendant(emp.id)}
                                                className="w-4 h-4 accent-slate-800"
                                            />
                                            <span className="ml-3 font-medium text-slate-700">{emp.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="bg-[#0F172A] text-white rounded-2xl shadow-sm p-6 sticky top-24">
                        <h2 className="text-lg font-semibold mb-4">Muhtasari (Summary)</h2>
                        <div className="space-y-2 mb-5 min-h-[60px]">
                            {selectedServices.length === 0 && (
                                <p className="text-slate-500 text-sm italic">No services selected.</p>
                            )}
                            {selectedServices.map((id) => {
                                const s = services.find((sv) => sv.id === id);
                                return (
                                    <div key={id} className="flex justify-between text-slate-300 text-sm">
                                        <span>{s?.name}</span>
                                        <span>KES {s?.base_price.toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Total</span>
                            <span className="text-2xl font-bold text-accent">KES {totalPrice.toLocaleString()}</span>
                        </div>
                        {selectedAttendants.length > 0 && (
                            <p className="text-xs text-slate-500 mt-3">
                                Commission per attendant:{' '}
                                <span className="text-slate-300 font-semibold">
                                    KES {((totalPrice * 0.3) / selectedAttendants.length).toFixed(0)}
                                </span>{' '}
                                (30% split {selectedAttendants.length} ways)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
