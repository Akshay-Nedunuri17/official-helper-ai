
-- 1) Preferences on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT
  '{"trending_schemes": true, "complaint_updates": true, "announcements": true}'::jsonb;

-- 2) Complaint status change -> notify owner
CREATE OR REPLACE FUNCTION public.notify_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pref BOOLEAN;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     OR COALESCE(NEW.admin_response,'') IS DISTINCT FROM COALESCE(OLD.admin_response,'') THEN
    SELECT COALESCE((notification_prefs->>'complaint_updates')::boolean, true)
      INTO pref FROM public.profiles WHERE id = NEW.user_id;
    IF COALESCE(pref, true) THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'complaint_update',
        'Complaint ' || NEW.tracking_number || ' — ' || replace(NEW.status,'_',' '),
        COALESCE(NULLIF(NEW.admin_response,''), 'Your complaint status changed to ' || replace(NEW.status,'_',' ') || '.'),
        '/complaints'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_complaint_status ON public.complaints;
CREATE TRIGGER trg_notify_complaint_status
AFTER UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.notify_complaint_status_change();

-- 3) New/updated trending scheme -> fan out notifications
CREATE OR REPLACE FUNCTION public.notify_trending_scheme()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_trending IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_trending IS TRUE THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT
    p.id,
    'trending_scheme',
    'New trending scheme: ' || NEW.name_en,
    COALESCE(left(NEW.description_en, 160), 'A new scheme is trending that may interest you.'),
    '/schemes'
  FROM public.profiles p
  WHERE COALESCE((p.notification_prefs->>'trending_schemes')::boolean, true)
    AND (NEW.state IS NULL OR p.state IS NULL OR lower(p.state) = lower(NEW.state));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_trending_insert ON public.schemes;
CREATE TRIGGER trg_notify_trending_insert
AFTER INSERT ON public.schemes
FOR EACH ROW EXECUTE FUNCTION public.notify_trending_scheme();

DROP TRIGGER IF EXISTS trg_notify_trending_update ON public.schemes;
CREATE TRIGGER trg_notify_trending_update
AFTER UPDATE OF is_trending ON public.schemes
FOR EACH ROW EXECUTE FUNCTION public.notify_trending_scheme();

REVOKE EXECUTE ON FUNCTION public.notify_complaint_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_trending_scheme() FROM PUBLIC, anon, authenticated;
