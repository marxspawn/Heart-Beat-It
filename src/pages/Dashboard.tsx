import { useNavigate } from 'react-router-dom';
import { Settings, Share2, Activity } from 'lucide-react';
import { useHeartRateSimulator } from '@/hooks/useHeartRateSimulator';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { BpmDisplay } from '@/components/BpmDisplay';
import { HeartRateChart } from '@/components/HeartRateChart';
import { EmergencyControls } from '@/components/EmergencyControls';
import { SpikeLog } from '@/components/SpikeLog';
import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  high_bpm_threshold: 110,
  spike_sensitivity: 20,
  spike_window_seconds: 60,
  emergency_contact_phone: null as string | null,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const heartRate = useHeartRateSimulator();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [spikes, setSpikes] = useState<any[]>([]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('heartbeatit_settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  const { alert, silence } = useAlertSystem(heartRate.bpm, heartRate.history, {
    highBpmThreshold: settings.high_bpm_threshold,
    spikeSensitivity: settings.spike_sensitivity,
    spikeWindowSeconds: settings.spike_window_seconds,
  });

  // Log spikes locally
  useEffect(() => {
    if (alert.isAlert && alert.alertType !== 'none') {
      const prevBpm = heartRate.history.length > 1
        ? heartRate.history[heartRate.history.length - 2]?.bpm
        : null;
      const spike = {
        id: crypto.randomUUID(),
        bpm: heartRate.bpm,
        previous_bpm: prevBpm,
        triggered_at: new Date().toISOString(),
        acknowledged: false,
      };
      setSpikes(prev => [spike, ...prev].slice(0, 20));
    }
  }, [alert.isAlert, alert.alertType]);

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300 ${alert.isAlert && !alert.isSilenced ? 'animate-flash-emergency' : ''}`}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon" />
          <h1 className="font-mono font-bold text-neon text-sm tracking-wider">HEART BEAT IT</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/share')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {alert.isAlert && !alert.isSilenced && (
          <div className="bg-destructive/20 border border-emergency rounded-xl p-4 text-center glow-emergency">
            <p className="text-emergency font-bold font-mono text-lg">{alert.message}</p>
          </div>
        )}

        <BpmDisplay bpm={heartRate.bpm} isAlert={alert.isAlert && !alert.isSilenced} />

        <EmergencyControls
          onSilence={silence}
          isAlert={alert.isAlert}
          isSilenced={alert.isSilenced}
          emergencyPhone={settings.emergency_contact_phone ?? undefined}
        />

        <HeartRateChart history={heartRate.history} threshold={settings.high_bpm_threshold} />

        <SpikeLog spikes={spikes} />
      </main>
    </div>
  );
}
