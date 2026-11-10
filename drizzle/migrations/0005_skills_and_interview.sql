CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'ADDITIONAL',
  level text,
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  notes text,
  goal text,
  improving boolean NOT NULL DEFAULT false,
  is_custom boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own skills" ON public.skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.learning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  title text NOT NULL,
  target_date date,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_goals TO authenticated;
GRANT ALL ON public.learning_goals TO service_role;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learning goals" ON public.learning_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  category text NOT NULL DEFAULT 'HR',
  preset_key text,
  question text,
  answer text,
  status text NOT NULL DEFAULT 'NOT_STARTED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_questions TO authenticated;
GRANT ALL ON public.interview_questions TO service_role;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interview questions" ON public.interview_questions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.seed_skills_and_questions(_uid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.skills (user_id, name, category, is_custom)
  SELECT _uid, s.name, s.cat, false FROM (VALUES
    ('HTML','FRONTEND'),('CSS','FRONTEND'),('JavaScript','FRONTEND'),('TypeScript','FRONTEND'),('React','FRONTEND'),('Vue','FRONTEND'),('Responsive Design','FRONTEND'),('Accessibility (WCAG)','FRONTEND'),
    ('Git and GitHub','TOOLS'),('REST APIs','TOOLS'),('Postman','TOOLS'),('Storybook','TOOLS'),('Figma','TOOLS'),
    ('Web Security','SECURITY'),('GDPR and Data Protection','SECURITY'),('Secure Authentication','SECURITY'),('Web Storage','SECURITY'),
    ('Testing and Debugging','ADDITIONAL'),('UI/UX Design','ADDITIONAL'),('System Integration','ADDITIONAL')
  ) AS s(name, cat)
  ON CONFLICT (user_id, name) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.interview_questions WHERE user_id = _uid) THEN
    INSERT INTO public.interview_questions (user_id, category, preset_key)
    SELECT _uid, q.cat, q.k FROM (VALUES
      ('HTML','html1'),('HTML','html2'),('CSS','css1'),('CSS','css2'),('JAVASCRIPT','js1'),('JAVASCRIPT','js2'),('JAVASCRIPT','js3'),
      ('REACT','react1'),('REACT','react2'),('REACT','react3'),('TYPESCRIPT','ts1'),('TYPESCRIPT','ts2'),
      ('HR','hr1'),('HR','hr2'),('HR','hr3'),('HR','hr4')
    ) AS q(cat, k);
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.seed_skills_and_questions(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.seed_skills_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.seed_skills_and_questions(NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_skills AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.seed_skills_new_user();

SELECT public.seed_skills_and_questions(id) FROM auth.users;