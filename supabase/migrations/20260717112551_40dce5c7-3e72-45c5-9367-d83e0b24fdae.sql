
-- 1. Fix scheme_views INSERT: prevent spoofing other users' user_id
DROP POLICY IF EXISTS "Anyone insert views" ON public.scheme_views;
CREATE POLICY "Insert own or anonymous views" ON public.scheme_views
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 2. Fix search_logs INSERT: prevent spoofing other users' user_id
DROP POLICY IF EXISTS "Anyone insert search logs" ON public.search_logs;
CREATE POLICY "Insert own or anonymous search logs" ON public.search_logs
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 3. Complaint photos: remove public read; allow owner and admins only.
--    Files are uploaded under a folder equal to auth.uid().
DROP POLICY IF EXISTS "Public read complaint photos" ON storage.objects;
CREATE POLICY "Owner or admin read complaint photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'complaint-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- 4. has_role SECURITY DEFINER: revoke EXECUTE from anon & authenticated.
--    Server functions using the service_role client can still call it,
--    and RLS policies that reference has_role continue to work because
--    policy expressions run as the function/policy owner.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
