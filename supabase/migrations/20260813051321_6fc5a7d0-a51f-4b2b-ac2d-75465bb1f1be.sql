DROP POLICY IF EXISTS "Owner or admin read complaint photos" ON storage.objects;
CREATE POLICY "Owner read own complaint photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-photos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);