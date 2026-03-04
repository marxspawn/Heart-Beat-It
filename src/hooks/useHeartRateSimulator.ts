import { useState, useEffect, useCallback, useRef } from 'react';

interface HeartRateData {
  bpm: number;
  timestamp: Date;
  history: { bpm: number; time: Date }[];
}

export function useHeartRateSimulator() {
  const [data, setData] = useState<HeartRateData>({
    bpm: 72,
    timestamp: new Date(),
    history: [],
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateBPM = useCallback((prevBpm: number) => {
    // Simulate realistic heart rate with occasional spikes
    const rand = Math.random();
    let delta = (Math.random() - 0.5) * 6; // Normal variance ±3

    // 5% chance of a spike
    if (rand > 0.95) {
      delta = Math.random() * 40 + 15; // Spike +15 to +55
    }
    // 3% chance of drop
    if (rand < 0.03) {
      delta = -(Math.random() * 20 + 10);
    }

    return Math.max(45, Math.min(180, Math.round(prevBpm + delta)));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const newBpm = generateBPM(prev.bpm);
        const now = new Date();
        const newHistory = [
          ...prev.history.slice(-119), // Keep last 120 readings (1 hour at 30s intervals)
          { bpm: newBpm, time: now },
        ];
        return { bpm: newBpm, timestamp: now, history: newHistory };
      });
    }, 2000); // Every 2s for demo (would be 30s with real API)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateBPM]);

  return data;
}
