import { Phone, ShieldCheck } from 'lucide-react';

interface EmergencyControlsProps {
  onSilence: () => void;
  isAlert: boolean;
  isSilenced: boolean;
  emergencyPhone?: string;
  showCallButton?: boolean;
}

export function EmergencyControls({ onSilence, isAlert, isSilenced, emergencyPhone, showCallButton = false }: EmergencyControlsProps) {
  const handleCall = () => {
    if (emergencyPhone) {
      window.open(`tel:${emergencyPhone}`, '_self');
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Silence button */}
      <button
        onClick={onSilence}
        className={`w-full py-6 rounded-xl text-xl font-bold uppercase tracking-wider transition-all duration-200 ${
          isAlert
            ? 'bg-primary text-primary-foreground glow-neon animate-pulse-neon'
            : isSilenced
            ? 'bg-secondary text-secondary-foreground border border-border'
            : 'bg-secondary text-secondary-foreground border border-border opacity-50'
        }`}
        disabled={!isAlert && !isSilenced}
      >
        <div className="flex items-center justify-center gap-3">
          <ShieldCheck className="w-7 h-7" />
          {isSilenced ? 'Silenced (5 min)' : 'I Am OK / Silence'}
        </div>
      </button>

      {/* Emergency call button — only visible during active alert */}
      {showCallButton && emergencyPhone && (
        <button
          onClick={handleCall}
          className="w-full py-5 rounded-xl text-lg font-bold uppercase tracking-wider transition-all duration-200 bg-destructive text-destructive-foreground glow-emergency hover:brightness-110"
        >
          <div className="flex items-center justify-center gap-3">
            <Phone className="w-6 h-6" />
            Call Son
          </div>
        </button>
      )}
    </div>
  );
}
