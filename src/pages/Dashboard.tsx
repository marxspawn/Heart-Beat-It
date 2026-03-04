import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Share2, LogOut, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useHeartRateSimulator } from '@/hooks/useHeartRateSimulator';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { BpmDisplay } from '@/components/BpmDisplay';
import { HeartRateChart } from '@/components/HeartRateChart';
import { EmergencyControls } from '@/components/EmergencyControls';
import { SpikeLog } from '@/components/SpikeLog';
import { toast } from 'sonner';

interface UserSettings {
  high_bpm_threshold: number;
  spike_sensitivity: number;
  spike_window_seconds: number;
  emergency_contact_phone: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const heartRate = useHeartRateSimulator();
  const [settings, setSettings] = useState<UserSettings>({
    high_bpm_threshold: 110,
    spike_sensitivity: 20,
    spike_window_seconds: 60,
    emergency_contact_phone: null,
  });
  const [spikes, setSpikes] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const { alert, silence } = useAlertSystem(heartRate.bpm, heartRate.history, {
    highBpmThreshold: settings.high_bpm_threshold,
    spikeSensitivity: settings.spike_sensitivity,
    spikeWindowSeconds: settings.spike_window_seconds,
  });

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load settings
      const { data: s } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (s) {
        setSettings({
          high_bpm_threshold: s.high_bpm_threshold,
          spike_sensitivity: s.spike_sensitivity,
          spike_window_seconds: s.spike_window_seconds,
          emergency_contact_phone: s.emergency_contact_phone,
        });
      } else {
        // Create default settings
        await supabase.from('user_settings').insert({ user_id: user.id });
      }

      // Load spikes
      const { data: sp } = await supabase
        .from('heart_rate_spikes')
        .select('*')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false })
        .limit(20);
      if (sp) setSpikes(sp);

      // Init live data
      await supabase.from('heart_rate_live').upsert({
        user_id: user.id,
        bpm: 0,
        is_alert: false,
      });
    };
    loadData();
  }, []);

  // Update live data + log spikes
  useEffect(() => {
    if (!userId) return;

    // Update live table for caregivers
    supabase.from('heart_rate_live').update({
      bpm: heartRate.bpm,
      is_alert: alert.isAlert,
    }).eq('user_id', userId).then();

    // Log spike if alert just triggered
    if (alert.isAlert && alert.alertType !== 'none') {
      const prevBpm = heartRate.history.length > 1
        ? heartRate.history[heartRate.history.length - 2]?.bpm
        : null;

      supabase.from('heart_rate_spikes').insert({
        user_id: userId,
        bpm: heartRate.bpm,
        previous_bpm: prevBpm ?? null,
      }).then(({ data }) => {
        if (data) setSpikes(prev => [data, ...prev].slice(0, 20));
      });
    }
  }, [heartRate.bpm, alert.isAlert, userId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300 ${alert.isAlert && !alert.isSilenced ? 'animate-flash-emergency' : ''}`}>
      {/* Header */}
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
          <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Alert banner */}
        {alert.isAlert && !alert.isSilenced && (
          <div className="bg-destructive/20 border border-emergency rounded-xl p-4 text-center glow-emergency">
            <p className="text-emergency font-bold font-mono text-lg">{alert.message}</p>
          </div>
        )}

        {/* BPM Display */}
        <BpmDisplay bpm={heartRate.bpm} isAlert={alert.isAlert && !alert.isSilenced} />

        {/* Emergency Controls */}
        <EmergencyControls
          onSilence={silence}
          isAlert={alert.isAlert}
          isSilenced={alert.isSilenced}
          emergencyPhone={settings.emergency_contact_phone ?? undefined}
        />

        {/* Chart */}
        <HeartRateChart
          history={heartRate.history}
          threshold={settings.high_bpm_threshold}
        />

        {/* Spike Log */}
        <SpikeLog spikes={spikes} />
      </main>
    </div>
  );
}
