
-- Function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  high_bpm_threshold INTEGER NOT NULL DEFAULT 110,
  spike_sensitivity INTEGER NOT NULL DEFAULT 20,
  spike_window_seconds INTEGER NOT NULL DEFAULT 60,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Heart rate spikes log
CREATE TABLE public.heart_rate_spikes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bpm INTEGER NOT NULL,
  previous_bpm INTEGER,
  duration_seconds INTEGER,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.heart_rate_spikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spikes" ON public.heart_rate_spikes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spikes" ON public.heart_rate_spikes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spikes" ON public.heart_rate_spikes FOR UPDATE USING (auth.uid() = user_id);

-- Caregiver links
CREATE TABLE public.caregiver_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own links" ON public.caregiver_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links" ON public.caregiver_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links" ON public.caregiver_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read active links by token" ON public.caregiver_links FOR SELECT USING (is_active = true);

-- Real-time heart rate data (latest reading per user)
CREATE TABLE public.heart_rate_live (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bpm INTEGER NOT NULL DEFAULT 0,
  is_alert BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.heart_rate_live ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own live data" ON public.heart_rate_live FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own live data" ON public.heart_rate_live FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own live data" ON public.heart_rate_live FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Caregivers can view via token" ON public.heart_rate_live FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.caregiver_links WHERE caregiver_links.user_id = heart_rate_live.user_id AND caregiver_links.is_active = true
  )
);

-- Enable realtime on heart_rate_live
ALTER PUBLICATION supabase_realtime ADD TABLE public.heart_rate_live;
