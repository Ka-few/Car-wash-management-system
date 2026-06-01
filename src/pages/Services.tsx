import { useEffect, useState, useCallback } from 'react';
import { Settings, Plus, Edit2, PencilLine, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Service } from '../types';

function ServiceModal({
    initial,
    onSave,
    onClose,
}: {
    initial?: Service;
    onSave: (name: string, price: number, description: string) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [price, setPrice] = useState(initial?.base_price.toString() ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                <h2 className="text-xl font-bold text-slate-800">
                    {initial ? 'Edit Service' : 'Add New Service (Huduma Mpya)'}
                </h2>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Service Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Full Body Wash"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Price (KES) *</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="500"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief details about the service"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:outline-none h-24 resize-none"
                        />
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (name.trim() && price) {
                                onSave(name, parseFloat(price), description);
                            }
                        }}
                        className="flex-1 px-4 py-2.5 bg-accent hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors"
                    >
                        Save Service
                    </button>
                </div>
            </div>
        </div>
    );
}

export function Services() {
    const [services, setServices] = useState<Service[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState<Service | undefined>();
    const [toast, setToast] = useState('');

    const load = useCallback(() => {
        api.getServices().then(setServices).catch(() => { });
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async (name: string, price: number, description: string) => {
        try {
            if (editTarget) {
                await api.updateService(editTarget.id, name, price, description || undefined);
                showToast('Service updated successfully!');
            } else {
                await api.createService(name, price, description || undefined);
                showToast('New service added!');
            }
            setShowModal(false);
            setEditTarget(undefined);
            load();
        } catch (e) {
            showToast(`Error: ${e}`);
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed top-4 right-4 z-50 px-5 py-3 bg-green-600 text-white rounded-xl shadow-lg text-sm font-medium">
                    {toast}
                </div>
            )}

            {showModal && (
                <ServiceModal
                    initial={editTarget}
                    onSave={handleSave}
                    onClose={() => {
                        setShowModal(false);
                        setEditTarget(undefined);
                    }}
                />
            )}

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Services Catalog</h1>
                    <p className="text-slate-500 mt-1">Orodha ya huduma (Manage services & prices)</p>
                </div>
                <button
                    onClick={() => {
                        setEditTarget(undefined);
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-accent hover:bg-yellow-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Service
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                    <div
                        key={service.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-accent/10 rounded-xl">
                                <Settings className="w-6 h-6 text-accent" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Price</p>
                                <p className="text-xl font-bold text-slate-800">KES {service.base_price.toLocaleString()}</p>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-1">{service.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 h-10">
                            {service.description || 'No description provided.'}
                        </p>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setEditTarget(service);
                                    setShowModal(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <PencilLine className="w-4 h-4" /> Edit
                            </button>
                        </div>
                    </div>
                ))}

                {services.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-400">
                        <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No services found. Add your first service to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
