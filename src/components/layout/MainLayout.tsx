import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto h-full fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
