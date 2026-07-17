
CREATE TABLE public.translate_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_language TEXT NOT NULL,
  entries_count INTEGER NOT NULL,
  total_chars INTEGER NOT NULL,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.translate_audit_logs TO authenticated;
GRANT ALL ON public.translate_audit_logs TO service_role;

ALTER TABLE public.translate_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs; nobody except service_role can write.
CREATE POLICY "Admins read translate audit logs"
  ON public.translate_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX translate_audit_logs_created_idx ON public.translate_audit_logs (created_at DESC);
CREATE INDEX translate_audit_logs_user_idx ON public.translate_audit_logs (user_id, created_at DESC);
