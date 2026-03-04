import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface HeartRateChartProps {
  history: { bpm: number; time: Date }[];
  threshold: number;
}

export function HeartRateChart({ history, threshold }: HeartRateChartProps) {
  const chartData = history.map(h => ({
    bpm: h.bpm,
    time: format(h.time, 'HH:mm:ss'),
  }));

  return (
    <div className="w-full h-48 surface-glass rounded-lg p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">History</p>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData}>
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(220, 10%, 55%)' }} interval="preserveStartEnd" />
          <YAxis domain={[40, 180]} tick={{ fontSize: 10, fill: 'hsl(220, 10%, 55%)' }} width={35} />
          <ReferenceLine y={threshold} stroke="hsl(0, 85%, 55%)" strokeDasharray="4 4" strokeWidth={1.5} />
          <Line
            type="monotone"
            dataKey="bpm"
            stroke="hsl(145, 100%, 50%)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
