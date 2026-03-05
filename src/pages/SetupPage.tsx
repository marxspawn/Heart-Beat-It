import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

export default function SetupPage() {
  const navigate = useNavigate();
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!label.trim() || !phone.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    const saved = localStorage.getItem('heartbeatit_settings');
    const settings = saved ? JSON.parse(saved) : {};
    localStorage.setItem('heartbeatit_settings', JSON.stringify({
      ...settings,
      emergency_contact_label: label.trim(),
      emergency_contact_phone: phone.trim(),
    }));
    localStorage.setItem('heartbeatit_setup_done', 'true');
    navigate('/');
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <Heart className="w-12 h-12 text-primary mx-auto" />
          <h1 className="font-mono font-bold text-foreground text-2xl tracking-wider">
            HEART BEAT IT
          </h1>
          <p className="text-muted-foreground text-sm">
            Let's set up your emergency contact so the app can help when it matters most.
          </p>
        </div>

        <div className="surface-glass rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">
              Who should this button call?
            </label>
            <input
              type="text"
              value={label}
              onChange={e => { setLabel(e.target.value); setError(''); }}
              className={inputClass}
              placeholder='e.g. "Call Michael" or "Emergency"'
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground">
              This text will appear on the emergency button during alerts.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              className={inputClass}
              placeholder="+1 555 123 4567"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-mono">{error}</p>
          )}

          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
