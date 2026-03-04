import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BpmDisplay } from '@/components/BpmDisplay';
import { Badge } from '@/components/ui/badge';
import { Eye, Wifi, WifiOff } from 'lucide-react';

export default function CaregiverView() {
  const { token } = useParams<{ token: string }>();
  const [bpm, setBpm] = useState<number | null>(null);
  const [isAlert, setIsAlert] = useState(false);
  const [monitoringMode, setMonitoringMode] = useState<'standard' | 'afib'>('standard');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // First find the user_id for this token
    const init = async () => {
      const { data: link, error: linkErr } = await supabase
        .from('caregiver_links')
        .select('user_id')
        .eq('link_token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (linkErr || !link) {
        setError('Invalid or expired caregiver link');
        return;
      }

      // Get initial data
      const { data: live } = await supabase
        .from('heart_rate_live')
        .select('*')
        .eq('user_id', link.user_id)
        .maybeSingle();

      if (live) {
        setBpm(live.bpm);
        setIsAlert(live.is_alert);
      }

      // Subscribe to realtime changes
      const channel = supabase
        .channel('caregiver-live')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'heart_rate_live',
            filter: `user_id=eq.${link.user_id}`,
          },
          (payload) => {
            const data = payload.new as any;
            setBpm(data.bpm);
            setIsAlert(data.is_alert);
          }
        )
        .subscribe((status) => {
          setConnected(status === 'SUBSCRIBED');
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };

    init();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="surface-glass rounded-2xl p-8 text-center max-w-sm">
          <p className="text-emergency font-bold mb-2">Link Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300 ${isAlert ? 'animate-flash-emergency' : ''}`}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-neon" />
          <h1 className="font-mono font-bold text-neon text-sm tracking-wider">CAREGIVER VIEW</h1>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-4 h-4 text-neon" />
          ) : (
            <WifiOff className="w-4 h-4 text-emergency" />
          )}
          <span className="text-xs text-muted-foreground">
            {connected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center">
        {/* Monitoring Mode Badge */}
        <div className="mb-8">
          <Badge
            variant={monitoringMode === 'afib' ? 'destructive' : 'default'}
            className="text-xs font-mono tracking-wider px-4 py-1"
          >
            {monitoringMode === 'afib' ? '⚡ AFib Mode — 30s Buffer' : '● Standard Mode'}
          </Badge>
        </div>

        {bpm !== null ? (
          <>
            <BpmDisplay bpm={bpm} isAlert={isAlert} />
            {isAlert && (
              <div className="mt-8 bg-destructive/20 border border-emergency rounded-xl p-4 text-center glow-emergency w-full max-w-md">
                <p className="text-emergency font-bold font-mono text-lg">⚠ ALERT ACTIVE</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground animate-pulse">Waiting for heart rate data...</p>
          </div>
        )}

        <p className="mt-12 text-xs text-muted-foreground text-center">
          Read-only view • Data updates in real-time
        </p>
      </main>
    </div>
  );
}
