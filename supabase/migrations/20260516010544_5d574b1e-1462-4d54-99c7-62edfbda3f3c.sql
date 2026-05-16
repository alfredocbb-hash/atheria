REVOKE EXECUTE ON FUNCTION public.log_audit(TEXT, TEXT, UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_member_user(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claims_audit_notify() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.work_orders_audit_notify() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payments_audit_notify() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.invoices_audit() FROM PUBLIC, anon, authenticated;