import { useState, useEffect, useCallback, useRef } from 'react';

interface AlertState {
  isAlert: boolean;
  isSilenced: boolean;
  alertType: 'none' | 'high_bpm' | 'spike';
  message: string;
}

interface AlertConfig {
  highBpmThreshold: number;
  spikeSensitivity: number;
  spikeWindowSeconds: number;
}

export function useAlertSystem(
  currentBpm: number,
  history: { bpm: number; time: Date }[],
  config: AlertConfig
) {
  const [alert, setAlert] = useState<AlertState>({
    isAlert: false,
    isSilenced: false,
    alertType: 'none',
    message: '',
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for alerts
  useEffect(() => {
    if (alert.isSilenced) return;

    // Check high BPM
    if (currentBpm >= config.highBpmThreshold) {
      setAlert({
        isAlert: true,
        isSilenced: false,
        alertType: 'high_bpm',
        message: `HIGH BPM: ${currentBpm} exceeds threshold of ${config.highBpmThreshold}`,
      });
      return;
    }

    // Check spike
    const windowStart = new Date(Date.now() - config.spikeWindowSeconds * 1000);
    const recentReadings = history.filter(h => h.time >= windowStart);
    if (recentReadings.length >= 2) {
      const minBpm = Math.min(...recentReadings.map(r => r.bpm));
      const spike = currentBpm - minBpm;
      if (spike >= config.spikeSensitivity) {
        setAlert({
          isAlert: true,
          isSilenced: false,
          alertType: 'spike',
          message: `SPIKE: +${spike} BPM in ${config.spikeWindowSeconds}s`,
        });
        return;
      }
    }

    // Clear alert
    if (alert.isAlert && !alert.isSilenced) {
      setAlert({ isAlert: false, isSilenced: false, alertType: 'none', message: '' });
    }
  }, [currentBpm, history, config, alert.isSilenced, alert.isAlert]);

  // Siren sound
  useEffect(() => {
    if (alert.isAlert && !alert.isSilenced) {
      // Create oscillator-based siren
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        const stopTimeout = setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 1500);

        return () => {
          clearTimeout(stopTimeout);
          try { osc.stop(); ctx.close(); } catch {}
        };
      } catch {}
    }
  }, [alert.isAlert, alert.isSilenced, currentBpm]);

  const silence = useCallback(() => {
    setAlert(prev => ({ ...prev, isSilenced: true, isAlert: false }));
    // Auto-unsilence after 5 minutes
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(() => {
      setAlert(prev => ({ ...prev, isSilenced: false }));
    }, 5 * 60 * 1000);
  }, []);

  return { alert, silence };
}
