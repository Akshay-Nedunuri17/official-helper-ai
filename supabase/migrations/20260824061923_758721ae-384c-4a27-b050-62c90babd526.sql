ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS routed_department text,
  ADD COLUMN IF NOT EXISTS routed_office_id uuid REFERENCES public.offices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS routed_email text,
  ADD COLUMN IF NOT EXISTS portal_name text,
  ADD COLUMN IF NOT EXISTS portal_url text,
  ADD COLUMN IF NOT EXISTS portal_reference text,
  ADD COLUMN IF NOT EXISTS portal_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS forwarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS forward_status text NOT NULL DEFAULT 'not_sent';

CREATE TABLE IF NOT EXISTS public.complaint_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS complaint_events_complaint_idx ON public.complaint_events(complaint_id, created_at);

GRANT SELECT, INSERT ON public.complaint_events TO authenticated;
GRANT ALL ON public.complaint_events TO service_role;

ALTER TABLE public.complaint_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View events for own complaints"
ON public.complaint_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Insert events for own complaints"
ON public.complaint_events FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE OR REPLACE FUNCTION public.log_complaint_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.complaint_events (complaint_id, event_type, title, detail)
  VALUES (NEW.id, 'filed', 'Complaint saved in JanSahayak',
    'Tracking number ' || NEW.tracking_number || ' was generated. Your complaint is stored securely and visible to the JanSahayak admin team.');

  IF NEW.routed_department IS NOT NULL THEN
    INSERT INTO public.complaint_events (complaint_id, event_type, title, detail)
    VALUES (NEW.id, 'routed', 'Department identified',
      'Suggested department: ' || NEW.routed_department || COALESCE(' (' || NEW.routed_email || ')', ''));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_complaint_created ON public.complaints;
CREATE TRIGGER trg_log_complaint_created
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.log_complaint_created();

CREATE OR REPLACE FUNCTION public.log_complaint_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.complaint_events (complaint_id, event_type, title, detail)
    VALUES (NEW.id, 'status', 'Status changed to ' || replace(NEW.status, '_', ' '),
      NULLIF(NEW.admin_response, ''));
  ELSIF COALESCE(NEW.admin_response,'') IS DISTINCT FROM COALESCE(OLD.admin_response,'') THEN
    INSERT INTO public.complaint_events (complaint_id, event_type, title, detail)
    VALUES (NEW.id, 'response', 'Official response added', NEW.admin_response);
  END IF;

  IF NEW.forwarded_at IS DISTINCT FROM OLD.forwarded_at AND NEW.forwarded_at IS NOT NULL THEN
    INSERT INTO public.complaint_events (complaint_id, event_type, title, detail)
    VALUES (NEW.id, 'forwarded', 'Forwarded to department by email',
      COALESCE('Sent to ' || NEW.routed_email, 'Sent to the routed department.'));
  END IF;

  IF NEW.portal_submitted_at IS DISTINCT FROM OLD.portal_submitted_at AND NEW.portal_submitted_at IS NOT NULL THEN
    INSERT INTO public.complaint_events (complaint_id, event_type, title, detail)
    VALUES (NEW.id, 'portal', 'Submitted to ' || COALESCE(NEW.portal_name, 'the official portal'),
      COALESCE('Official reference: ' || NEW.portal_reference, 'Marked as submitted on the government grievance portal.'));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_complaint_progress ON public.complaints;
CREATE TRIGGER trg_log_complaint_progress
AFTER UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.log_complaint_progress();