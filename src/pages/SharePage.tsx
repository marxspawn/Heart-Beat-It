import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CaregiverLink {
  id: string;
  link_token: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SharePage() {
  const navigate = useNavigate();
  const [links, setLinks] = useState<CaregiverLink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('caregiver_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setLinks(data);
  };

  const createLink = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('caregiver_links').insert({
      user_id: user.id,
      label: `Caregiver ${links.length + 1}`,
    });
    if (error) {
      toast.error('Failed to create link');
    } else {
      toast.success('Caregiver link created');
      loadLinks();
    }
    setLoading(false);
  };

  const deactivateLink = async (id: string) => {
    await supabase.from('caregiver_links').update({ is_active: false }).eq('id', id);
    toast.success('Link deactivated');
    loadLinks();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/caregiver/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-mono font-bold text-foreground text-sm tracking-wider">CAREGIVER SHARING</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <p className="text-muted-foreground text-sm">
          Generate a link to share with caregivers. They'll see your heart rate and alerts in real-time.
        </p>

        <button
          onClick={createLink}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Generate Caregiver Link
        </button>

        <div className="space-y-3">
          {links.map(link => (
            <div key={link.id} className={`surface-glass rounded-lg p-4 ${!link.is_active ? 'opacity-40' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{link.label || 'Caregiver'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${link.is_active ? 'bg-primary/20 text-neon' : 'bg-muted text-muted-foreground'}`}>
                  {link.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {link.is_active && (
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(link.link_token)}
                    className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copy Link
                  </button>
                  <button
                    onClick={() => deactivateLink(link.id)}
                    className="py-2 px-3 rounded-lg bg-destructive/20 text-emergency text-sm hover:bg-destructive/30 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
