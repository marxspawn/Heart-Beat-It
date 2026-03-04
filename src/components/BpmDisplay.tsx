import { Heart } from 'lucide-react';

interface BpmDisplayProps {
  bpm: number;
  isAlert: boolean;
}

export function BpmDisplay({ bpm, isAlert }: BpmDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Heart
          className={`w-10 h-10 ${isAlert ? 'text-emergency' : 'text-neon'} animate-heartbeat`}
          fill="currentColor"
        />
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Heart Rate
        </span>
      </div>
      <div
        className={`font-mono text-[10rem] leading-none font-extrabold tracking-tight ${
          isAlert ? 'text-emergency' : 'text-neon'
        }`}
      >
        {bpm}
      </div>
      <span
        className={`text-2xl font-mono font-semibold tracking-wider ${
          isAlert ? 'text-emergency' : 'text-neon'
        } opacity-70`}
      >
        BPM
      </span>
    </div>
  );
}
