
-- Add trending flag to schemes
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS is_trending BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- updated_at helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- COMPLAINTS
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL UNIQUE DEFAULT ('JS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own complaints" ON public.complaints FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete complaints" ON public.complaints FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER complaints_updated BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SCHEME VIEWS (analytics)
CREATE TABLE public.scheme_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.scheme_views TO authenticated, anon;
GRANT ALL ON public.scheme_views TO service_role;
ALTER TABLE public.scheme_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert views" ON public.scheme_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read views" ON public.scheme_views FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX scheme_views_scheme_idx ON public.scheme_views(scheme_id);

-- SEARCH LOGS (analytics)
CREATE TABLE public.search_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  results_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.search_logs TO authenticated, anon;
GRANT ALL ON public.search_logs TO service_role;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read search logs" ON public.search_logs FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- Storage policies for complaint-photos bucket (bucket created via tool)
CREATE POLICY "Public read complaint photos" ON storage.objects FOR SELECT USING (bucket_id = 'complaint-photos');
CREATE POLICY "Auth users upload complaint photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'complaint-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own complaint photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'complaint-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
