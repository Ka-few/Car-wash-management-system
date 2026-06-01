import { Car, LayoutDashboard, PlusCircle, Users, CreditCard, Settings } from 'lucide-react';
import { useAppStore } from '../../store';

export function Sidebar() {
    const { currentRoute, setRoute, isSidebarOpen } = useAppStore();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'new_job', label: 'New Job', icon: PlusCircle },
        { id: 'active_jobs', label: 'Job Board', icon: Car },
        { id: 'checkout', label: 'Checkout', icon: CreditCard },
        { id: 'employees', label: 'Staff', icon: Users },
        { id: 'services', label: 'Services', icon: Settings },
    ] as const;

    return (
        <aside
            className={`bg-primary text-white transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'
                }`}
        >
            <div className="p-4 flex items-center justify-center border-b border-secondary/50">
                <Car className="text-accent w-8 h-8" />
                {isSidebarOpen && (
                    <span className="ml-3 font-bold text-xl tracking-tight">SafiAuto</span>
                )}
            </div>

            <nav className="flex-1 py-6 px-3 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentRoute === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setRoute(item.id)}
                            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-accent/10 text-accent font-medium'
                                : 'hover:bg-secondary/40 text-slate-300 hover:text-white'
                                } ${!isSidebarOpen ? 'justify-center' : 'justify-start'}`}
                            title={!isSidebarOpen ? item.label : undefined}
                        >
                            <Icon
                                className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                                    } ${isSidebarOpen ? 'mr-3' : ''}`}
                            />
                            {isSidebarOpen && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-secondary/50 text-xs text-slate-400 text-center">
                {isSidebarOpen ? 'SafiAuto v1.0.0' : 'v1.0'}
            </div>
        </aside>
    );
}
