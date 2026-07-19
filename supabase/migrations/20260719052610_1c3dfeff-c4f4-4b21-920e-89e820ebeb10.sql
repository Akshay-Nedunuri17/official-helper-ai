
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS annual_income NUMERIC,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS caste_category TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

-- Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Public complaint status lookup (no PII)
CREATE OR REPLACE FUNCTION public.get_complaint_status(_tracking TEXT)
RETURNS TABLE (
  tracking_number TEXT,
  category TEXT,
  title TEXT,
  status TEXT,
  admin_response TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tracking_number, category, title, status, admin_response, created_at, updated_at
  FROM public.complaints
  WHERE tracking_number = upper(trim(_tracking))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_complaint_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_complaint_status(TEXT) TO anon, authenticated;
