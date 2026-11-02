DROP POLICY IF EXISTS "anon_select_items" ON public.items;
DROP POLICY IF EXISTS "anon_insert_items" ON public.items;
DROP POLICY IF EXISTS "anon_update_items" ON public.items;
DROP POLICY IF EXISTS "anon_delete_items" ON public.items;
DROP POLICY IF EXISTS "anon_select_requests" ON public.requests;
DROP POLICY IF EXISTS "anon_insert_requests" ON public.requests;
DROP POLICY IF EXISTS "anon_update_requests" ON public.requests;
DROP POLICY IF EXISTS "anon_delete_requests" ON public.requests;

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.admin_users TO authenticated;

CREATE POLICY "admin_users_read_self" ON public.admin_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "public_select_items" ON public.items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_manage_items" ON public.items
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "public_insert_requests" ON public.requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_manage_requests" ON public.requests
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));
