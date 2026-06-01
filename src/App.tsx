import { useEffect, useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { useAppStore } from './store';
import { Dashboard } from './pages/Dashboard';
import { NewJob } from './pages/NewJob';
import { ActiveJobs } from './pages/ActiveJobs';
import { Checkout } from './pages/Checkout';
import { Employees } from './pages/Employees';
import { Services } from './pages/Services';
import './App.css';

function App() {
  const { currentRoute, setRoute } = useAppStore();
  const [checkoutJobId, setCheckoutJobId] = useState<number | undefined>();

  // Listen for event dispatched from ActiveJobs when moving to checkout
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      setCheckoutJobId(id);
      setRoute('checkout');
    };
    window.addEventListener('goto-checkout', handler);
    return () => window.removeEventListener('goto-checkout', handler);
  }, [setRoute]);

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard': return <Dashboard />;
      case 'new_job': return <NewJob />;
      case 'active_jobs': return <ActiveJobs />;
      case 'checkout': return <Checkout preSelectedJobId={checkoutJobId} />;
      case 'employees': return <Employees />;
      case 'services': return <Services />;
      default: return <Dashboard />;
    }
  };

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
