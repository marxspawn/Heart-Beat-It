
-- Create heart_rates table
CREATE TABLE public.heart_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bpm integer NOT NULL,
  status text NOT NULL DEFAULT 'normal',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.heart_rates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON public.heart_rates
  FOR SELECT TO anon, authenticated
  USING (true);

-- Public insert access
CREATE POLICY "Public insert access" ON public.heart_rates
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Public update access
CREATE POLICY "Public update access" ON public.heart_rates
  FOR UPDATE TO anon, authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.heart_rates;
