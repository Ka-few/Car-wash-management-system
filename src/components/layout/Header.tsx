import { Menu, Search, Bell } from 'lucide-react';
import { useAppStore } from '../../store';

export function Header() {
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);

    return (
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 w-full relative">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tafuta (Search plates)..."
                        className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 w-64 transition-all"
                    />
                </div>
                <button className="p-2 relative text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold ml-2">
                    A
                </div>
            </div>
        </header>
    );
}
