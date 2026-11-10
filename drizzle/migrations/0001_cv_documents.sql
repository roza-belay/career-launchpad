CREATE TABLE public.cv_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  language text NOT NULL DEFAULT 'sv' CHECK (language IN ('sv','en')),
  kind text NOT NULL DEFAULT 'tailored' CHECK (kind IN ('main','international','tailored')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_documents TO authenticated;
GRANT ALL ON public.cv_documents TO service_role;
ALTER TABLE public.cv_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cv select" ON public.cv_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own cv insert" ON public.cv_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cv update" ON public.cv_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cv delete" ON public.cv_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX cv_documents_user_idx ON public.cv_documents(user_id);