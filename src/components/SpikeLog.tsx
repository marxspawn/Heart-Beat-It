import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

interface Spike {
  id: string;
  bpm: number;
  previous_bpm: number | null;
  triggered_at: string;
  acknowledged: boolean;
}

interface SpikeLogProps {
  spikes: Spike[];
}

export function SpikeLog({ spikes }: SpikeLogProps) {
  if (spikes.length === 0) {
    return (
      <div className="surface-glass rounded-lg p-6 text-center">
        <p className="text-muted-foreground text-sm">No spikes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="surface-glass rounded-lg p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5" />
        Medical Log — Recent Spikes
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {spikes.slice(0, 20).map(spike => (
          <div key={spike.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-emergency font-mono font-bold">{spike.bpm} BPM</span>
              {spike.previous_bpm && (
                <span className="text-muted-foreground">
                  (was {spike.previous_bpm})
                </span>
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {format(new Date(spike.triggered_at), 'MMM d, HH:mm:ss')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
