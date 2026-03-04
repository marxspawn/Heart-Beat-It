import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    high_bpm_threshold: 110,
    spike_sensitivity: 20,
    spike_window_seconds: 60,
    emergency_contact_phone: '',
    monitoring_mode: 'standard' as 'standard' | 'afib',
  });

  useEffect(() => {
    const saved = localStorage.getItem('heartbeatit_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm({
          high_bpm_threshold: parsed.high_bpm_threshold ?? 110,
          spike_sensitivity: parsed.spike_sensitivity ?? 20,
          spike_window_seconds: parsed.spike_window_seconds ?? 60,
          emergency_contact_phone: parsed.emergency_contact_phone ?? '',
          monitoring_mode: parsed.monitoring_mode ?? 'standard',
        });
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('heartbeatit_settings', JSON.stringify({
      ...form,
      emergency_contact_phone: form.emergency_contact_phone || null,
    }));
    toast.success('Settings saved');
    navigate('/');
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono";

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-mono font-bold text-foreground text-sm tracking-wider">SETTINGS</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Monitoring Mode Selection */}
        <div className="surface-glass rounded-xl p-5 space-y-4">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Monitoring Mode</label>

          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, monitoring_mode: 'standard' }))}
            className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
              form.monitoring_mode === 'standard'
                ? 'border-primary glow-neon bg-primary/10'
                : 'border-border bg-secondary/50 opacity-60'
            }`}
          >
            <p className="text-foreground font-bold text-sm">⚡ Instant Alert Mode</p>
            <p className="text-xs text-muted-foreground mt-1">
              Best for general monitoring. Alarm sounds immediately at threshold BPM.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, monitoring_mode: 'afib' }))}
            className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
              form.monitoring_mode === 'afib'
                ? 'border-destructive glow-emergency bg-destructive/10'
                : 'border-border bg-secondary/50 opacity-60'
            }`}
          >
            <p className="text-foreground font-bold text-sm">💓 AFib Mode (Stabilized)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Best for users with AFib. Alarm sounds only if Heart Rate stays at or above threshold for 30 consecutive seconds to prevent false alarms.
            </p>
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">High BPM Threshold</label>
          <input type="number" value={form.high_bpm_threshold} onChange={e => setForm(f => ({ ...f, high_bpm_threshold: +e.target.value }))} className={inputClass} min={60} max={200} />
          <p className="text-xs text-muted-foreground">Alert when BPM exceeds this value</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Spike Sensitivity (BPM)</label>
          <input type="number" value={form.spike_sensitivity} onChange={e => setForm(f => ({ ...f, spike_sensitivity: +e.target.value }))} className={inputClass} min={5} max={100} />
          <p className="text-xs text-muted-foreground">Alert on sudden BPM increase of this amount</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Spike Window (seconds)</label>
          <input type="number" value={form.spike_window_seconds} onChange={e => setForm(f => ({ ...f, spike_window_seconds: +e.target.value }))} className={inputClass} min={10} max={300} />
          <p className="text-xs text-muted-foreground">Time window to detect spikes</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Emergency Contact Phone</label>
          <input type="tel" value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} className={inputClass} placeholder="+1 555 123 4567" />
          <p className="text-xs text-muted-foreground">Phone number for the emergency call button (visible during alerts only)</p>
        </div>
        <button onClick={handleSave} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> Save Settings
        </button>
      </main>
    </div>
  );
}
