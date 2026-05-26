revoke execute on function public.place_order(jsonb,text,jsonb,text) from public, anon;
revoke execute on function public.update_order_status(uuid, public.order_status, public.payment_status) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;