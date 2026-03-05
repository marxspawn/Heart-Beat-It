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
  const [overrideBpm, setOverrideBpm] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateBPM = useCallback((prevBpm: number) => {
    const rand = Math.random();
    let delta = (Math.random() - 0.5) * 6;
    if (rand > 0.95) {
      delta = Math.random() * 40 + 15;
    }
    if (rand < 0.03) {
      delta = -(Math.random() * 20 + 10);
    }
    return Math.max(45, Math.min(180, Math.round(prevBpm + delta)));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const newBpm = overrideBpm !== null ? overrideBpm : generateBPM(prev.bpm);
        const now = new Date();
        const newHistory = [
          ...prev.history.slice(-119),
          { bpm: newBpm, time: now },
        ];
        return { bpm: newBpm, timestamp: now, history: newHistory };
      });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateBPM, overrideBpm]);

  return { ...data, overrideBpm, setOverrideBpm };
}
