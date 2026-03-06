import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));

const Index = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure env vars and Supabase client are initialized
    const timer = setTimeout(() => {
      const setupDone = localStorage.getItem('heartbeatit_setup_done');
      if (!setupDone) {
        navigate('/setup', { replace: true });
      } else {
        setReady(true);
      }
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Activity className="w-10 h-10 text-neon animate-pulse" />
        <p className="text-muted-foreground font-mono text-sm">Initializing...</p>
      </div>
    );
  }

  if (!ready) return null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <Activity className="w-10 h-10 text-neon animate-pulse" />
          <p className="text-muted-foreground font-mono text-sm">Loading dashboard...</p>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
};

export default Index;

