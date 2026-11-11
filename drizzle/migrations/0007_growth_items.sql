CREATE TABLE public.growth_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  hub text NOT NULL,
  title text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'TODO',
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_items TO authenticated;
GRANT ALL ON public.growth_items TO service_role;
ALTER TABLE public.growth_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own growth items" ON public.growth_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX growth_items_user_hub ON public.growth_items(user_id, hub);