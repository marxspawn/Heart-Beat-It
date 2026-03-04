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
  monitoringMode: 'standard' | 'afib';
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
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sustainedStartRef = useRef<number | null>(null);

  // Check for alerts
  useEffect(() => {
    if (alert.isSilenced) return;

    // Check high BPM with mode logic
    if (currentBpm >= config.highBpmThreshold) {
      if (config.monitoringMode === 'afib') {
        // AFib mode: only alert if sustained for 30 consecutive seconds
        if (sustainedStartRef.current === null) {
          sustainedStartRef.current = Date.now();
        }
        const elapsed = (Date.now() - sustainedStartRef.current) / 1000;
        if (elapsed >= 30) {
          setAlert({
            isAlert: true,
            isSilenced: false,
            alertType: 'high_bpm',
            message: `AFib ALERT: ${currentBpm} BPM sustained ≥30s (threshold ${config.highBpmThreshold})`,
          });
          return;
        }
        // Not yet 30s — clear any existing alert but keep counting
        if (alert.isAlert && alert.alertType === 'high_bpm') {
          setAlert({ isAlert: false, isSilenced: false, alertType: 'none', message: '' });
        }
      } else {
        // Standard mode: immediate alert
        sustainedStartRef.current = null;
        setAlert({
          isAlert: true,
          isSilenced: false,
          alertType: 'high_bpm',
          message: `HIGH BPM: ${currentBpm} exceeds threshold of ${config.highBpmThreshold}`,
        });
        return;
      }
    } else {
      // BPM dropped below threshold, reset sustained counter
      sustainedStartRef.current = null;
    }

    // Check spike — in AFib mode, ignore spikes under 30s
    if (config.monitoringMode !== 'afib') {
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
    }

    // Clear alert if BPM is below threshold and no spike
    if (alert.isAlert && !alert.isSilenced && currentBpm < config.highBpmThreshold) {
      setAlert({ isAlert: false, isSilenced: false, alertType: 'none', message: '' });
    }
  }, [currentBpm, history, config, alert.isSilenced, alert.isAlert]);

  // Siren sound
  useEffect(() => {
    if (alert.isAlert && !alert.isSilenced) {
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
    sustainedStartRef.current = null;
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = setTimeout(() => {
      setAlert(prev => ({ ...prev, isSilenced: false }));
    }, 5 * 60 * 1000);
  }, []);

  return { alert, silence };
}
