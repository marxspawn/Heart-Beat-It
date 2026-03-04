import { useNavigate } from 'react-router-dom';
import { Settings, Share2, Activity, FileText } from 'lucide-react';
import { useHeartRateSimulator } from '@/hooks/useHeartRateSimulator';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { BpmDisplay } from '@/components/BpmDisplay';
import { HeartRateChart } from '@/components/HeartRateChart';
import { EmergencyControls } from '@/components/EmergencyControls';
import { SpikeLog } from '@/components/SpikeLog';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { generateDoctorReport } from '@/lib/reportExport';

const DEFAULT_SETTINGS = {
  high_bpm_threshold: 110,
  spike_sensitivity: 20,
  spike_window_seconds: 60,
  emergency_contact_phone: null as string | null,
  monitoring_mode: 'standard' as 'standard' | 'afib',
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
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  const { alert, silence } = useAlertSystem(heartRate.bpm, heartRate.history, {
    highBpmThreshold: settings.high_bpm_threshold,
    spikeSensitivity: settings.spike_sensitivity,
    spikeWindowSeconds: settings.spike_window_seconds,
    monitoringMode: settings.monitoring_mode,
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
        monitoring_mode: settings.monitoring_mode,
        duration_seconds: null as number | null,
      };
      setSpikes(prev => [spike, ...prev].slice(0, 50));
    }
  }, [alert.isAlert, alert.alertType]);

  const handleExportReport = () => {
    generateDoctorReport(spikes, settings.monitoring_mode);
  };

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300 ${alert.isAlert && !alert.isSilenced ? 'animate-flash-emergency' : ''}`}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon" />
          <h1 className="font-mono font-bold text-neon text-sm tracking-wider">HEART BEAT IT</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleExportReport} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Generate Doctor Report">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/share')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Monitoring Mode Badge */}
        <div className="flex justify-center">
          <Badge
            variant={settings.monitoring_mode === 'afib' ? 'destructive' : 'default'}
            className="text-xs font-mono tracking-wider px-4 py-1"
          >
            {settings.monitoring_mode === 'afib' ? '⚡ AFib Mode — 30s Buffer' : '● Standard Mode'}
          </Badge>
        </div>

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
          showCallButton={alert.isAlert && !alert.isSilenced}
        />

        <HeartRateChart history={heartRate.history} threshold={settings.high_bpm_threshold} />

        <SpikeLog spikes={spikes} />
      </main>
    </div>
  );
}
