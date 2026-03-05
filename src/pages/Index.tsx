import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

const Index = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const setupDone = localStorage.getItem('heartbeatit_setup_done');
    if (!setupDone) {
      navigate('/setup', { replace: true });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) return null;
  return <Dashboard />;
};

export default Index;
