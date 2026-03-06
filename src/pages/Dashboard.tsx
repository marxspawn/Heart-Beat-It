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
  emergency_contact_label: null as string | null,
  monitoring_mode: 'standard' as 'standard' | 'afib',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { overrideBpm, setOverrideBpm, ...heartRate } = useHeartRateSimulator();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [spikes, setSpikes] = useState<any[]>([]);
  const [liveDbBpm, setLiveDbBpm] = useState<number | null>(null);
  const [dbConnected, setDbConnected] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('heartbeatit_settings');
    if (saved) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  // Subscribe to heart_rates table for real device data
  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | undefined;

    const initRealtime = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        console.warn('Backend env not found in build. Running in simulator-only mode.');
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');

        const { data, error } = await supabase
          .from('heart_rates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Failed to fetch latest heart rate:', error);
        } else if (data && isMounted) {
          setLiveDbBpm(data.bpm);
          setDbConnected(true);
        }

        const channel = supabase
          .channel('heart_rates_realtime')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'heart_rates' },
            (payload) => {
              if (!isMounted) return;
              const row = payload.new as any;
              setLiveDbBpm(row.bpm);
              setDbConnected(true);
            }
          )
          .subscribe();

        cleanup = () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Realtime initialization failed:', error);
      }
    };

    void initRealtime();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, []);

  // Use live DB BPM if available, otherwise fall back to simulator
  const displayBpm = liveDbBpm !== null ? liveDbBpm : heartRate.bpm;

  const { alert, silence } = useAlertSystem(displayBpm, heartRate.history, {
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
          <h1 className="font-mono font-bold text-neon text-sm tracking-wider">Heart Beat-It</h1>
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
        {/* Data Source Indicator */}
        <div className="flex justify-center gap-2">
          <Badge
            variant={settings.monitoring_mode === 'afib' ? 'destructive' : 'default'}
            className="text-sm font-mono tracking-wider px-5 py-1.5"
          >
            {settings.monitoring_mode === 'afib' ? 'MODE: AFib (30s Delay)' : 'MODE: Instant'}
          </Badge>
          {dbConnected && (
            <Badge variant="outline" className="text-sm font-mono tracking-wider px-3 py-1.5 border-neon text-neon">
              📡 Live
            </Badge>
          )}
        </div>

        {alert.isAlert && !alert.isSilenced && (
          <div className="bg-destructive/20 border border-emergency rounded-xl p-4 text-center glow-emergency">
            <p className="text-emergency font-bold font-mono text-lg">{alert.message}</p>
          </div>
        )}

        {!dbConnected && liveDbBpm === null && heartRate.history.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Activity className="w-12 h-12 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground font-mono text-lg">Waiting for Data...</p>
            <p className="text-muted-foreground/60 text-sm text-center max-w-xs">
              Connect a heart rate device or use the mock controls below to start monitoring.
            </p>
          </div>
        ) : (
          <BpmDisplay bpm={displayBpm} isAlert={alert.isAlert && !alert.isSilenced} />
        )}

        <EmergencyControls
          onSilence={silence}
          isAlert={alert.isAlert}
          isSilenced={alert.isSilenced}
          emergencyPhone={settings.emergency_contact_phone ?? undefined}
          emergencyLabel={settings.emergency_contact_label ?? undefined}
          showCallButton={alert.isAlert && !alert.isSilenced}
        />

        <HeartRateChart history={heartRate.history} threshold={settings.high_bpm_threshold} />

        <SpikeLog spikes={spikes} />

        {/* Mock Control Panel */}
        <div className="surface-glass rounded-xl p-4 space-y-3 border border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">🧪 Mock Controls</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-foreground font-mono">Override BPM:</label>
            <input
              type="number"
              value={overrideBpm ?? ''}
              onChange={e => setOverrideBpm(e.target.value ? +e.target.value : null)}
              placeholder="Auto"
              className="w-24 px-3 py-2 rounded-lg bg-input border border-border text-foreground font-mono text-sm"
            />
            <button
              onClick={() => setOverrideBpm(null)}
              className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-mono"
            >
              Reset
            </button>
          </div>
          {overrideBpm !== null && (
            <p className="text-xs text-neon font-mono">⚡ Locked at {overrideBpm} BPM</p>
          )}
        </div>
      </main>
    </div>
  );
}
