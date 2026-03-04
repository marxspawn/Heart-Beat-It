import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    high_bpm_threshold: 110,
    spike_sensitivity: 20,
    spike_window_seconds: 60,
    emergency_contact_phone: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setForm({
          high_bpm_threshold: data.high_bpm_threshold,
          spike_sensitivity: data.spike_sensitivity,
          spike_window_seconds: data.spike_window_seconds,
          emergency_contact_phone: data.emergency_contact_phone ?? '',
        });
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .update({
        high_bpm_threshold: form.high_bpm_threshold,
        spike_sensitivity: form.spike_sensitivity,
        spike_window_seconds: form.spike_window_seconds,
        emergency_contact_phone: form.emergency_contact_phone || null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
      navigate('/');
    }
    setLoading(false);
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
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">High BPM Threshold</label>
          <input
            type="number"
            value={form.high_bpm_threshold}
            onChange={e => setForm(f => ({ ...f, high_bpm_threshold: +e.target.value }))}
            className={inputClass}
            min={60}
            max={200}
          />
          <p className="text-xs text-muted-foreground">Alert when BPM exceeds this value</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Spike Sensitivity (BPM)</label>
          <input
            type="number"
            value={form.spike_sensitivity}
            onChange={e => setForm(f => ({ ...f, spike_sensitivity: +e.target.value }))}
            className={inputClass}
            min={5}
            max={100}
          />
          <p className="text-xs text-muted-foreground">Alert on sudden BPM increase of this amount</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Spike Window (seconds)</label>
          <input
            type="number"
            value={form.spike_window_seconds}
            onChange={e => setForm(f => ({ ...f, spike_window_seconds: +e.target.value }))}
            className={inputClass}
            min={10}
            max={300}
          />
          <p className="text-xs text-muted-foreground">Time window to detect spikes</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Emergency Contact Phone</label>
          <input
            type="tel"
            value={form.emergency_contact_phone}
            onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))}
            className={inputClass}
            placeholder="+1 555 123 4567"
          />
          <p className="text-xs text-muted-foreground">Phone number for the emergency call button</p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </main>
    </div>
  );
}
