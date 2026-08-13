REVOKE EXECUTE ON FUNCTION public.get_complaint_status(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_complaint_status(text) TO service_role;