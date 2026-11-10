CREATE TABLE public.vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  company text NOT NULL,
  title text NOT NULL,
  location text,
  arrangement text NOT NULL DEFAULT 'Hybrid',
  employment_type text NOT NULL DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP','TEMPORARY')),
  description text,
  job_url text,
  deadline date,
  skills text[] NOT NULL DEFAULT '{}',
  saved_on date NOT NULL DEFAULT CURRENT_DATE,
  application_id uuid UNIQUE REFERENCES public.applications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vacancies TO authenticated;
GRANT ALL ON public.vacancies TO service_role;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vacancies" ON public.vacancies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX vacancies_user_idx ON public.vacancies(user_id);