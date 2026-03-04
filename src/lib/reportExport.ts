import { format } from 'date-fns';

interface SpikeEntry {
  id: string;
  bpm: number;
  previous_bpm: number | null;
  triggered_at: string;
  acknowledged: boolean;
  monitoring_mode?: 'standard' | 'afib';
  duration_seconds?: number | null;
}

export function generateDoctorReport(spikes: SpikeEntry[], currentMode: 'standard' | 'afib') {
  const now = format(new Date(), 'yyyy-MM-dd HH:mm');
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    '           HEART BEAT IT — DOCTOR REPORT',
    '═══════════════════════════════════════════════════',
    '',
    `Generated: ${now}`,
    `Current Monitoring Mode: ${currentMode === 'afib' ? 'AFib (30s sustained buffer)' : 'Standard (immediate)'}`,
    `Total Spikes Recorded: ${spikes.length}`,
    '',
    '───────────────────────────────────────────────────',
    '  #  │ Time                │ BPM  │ Prev │ Mode   ',
    '───────────────────────────────────────────────────',
  ];

  spikes.forEach((s, i) => {
    const time = format(new Date(s.triggered_at), 'MMM dd, HH:mm:ss');
    const prev = s.previous_bpm != null ? String(s.previous_bpm).padStart(4) : '  — ';
    const mode = (s.monitoring_mode || 'standard') === 'afib' ? 'AFib ' : 'Std  ';
    lines.push(
      ` ${String(i + 1).padStart(3)} │ ${time.padEnd(19)} │ ${String(s.bpm).padStart(4)} │ ${prev} │ ${mode}`
    );
  });

  lines.push('───────────────────────────────────────────────────');
  lines.push('');
  lines.push('Note: This report is auto-generated from Heart Beat It');
  lines.push('monitoring data and should be reviewed by a physician.');
  lines.push('');

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `heartbeatit-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
