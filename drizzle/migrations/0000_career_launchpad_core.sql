CREATE TYPE public.app_status AS ENUM ('SAVED','APPLIED','INTERVIEWING','OFFER','CLOSED');

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  company text NOT NULL,
  title text NOT NULL,
  website text,
  job_url text,
  location text,
  arrangement text NOT NULL DEFAULT 'Hybrid',
  salary_min integer,
  salary_max integer,
  applied_date date,
  last_contact_date date,
  next_follow_up date,
  status public.app_status NOT NULL DEFAULT 'SAVED',
  recruiter_name text,
  recruiter_email text,
  recruiter_phone text,
  notes text,
  cv_version text,
  cover_letter text,
  interview_date timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own apps" ON public.applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  followed_up_on date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own followups" ON public.follow_ups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_tasks TO authenticated;
GRANT ALL ON public.planner_tasks TO service_role;
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.planner_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  task_id uuid NOT NULL REFERENCES public.planner_tasks(id) ON DELETE CASCADE,
  done_on date NOT NULL DEFAULT current_date,
  UNIQUE (task_id, done_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_completions TO authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions" ON public.task_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  week_start date NOT NULL,
  label text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_goals TO authenticated;
GRANT ALL ON public.weekly_goals TO service_role;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.weekly_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto follow-up: 7 days after last contact unless explicitly set
CREATE OR REPLACE FUNCTION public.set_follow_up() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.last_contact_date IS NOT NULL AND (
     TG_OP = 'INSERT' AND NEW.next_follow_up IS NULL
     OR TG_OP = 'UPDATE' AND NEW.last_contact_date IS DISTINCT FROM OLD.last_contact_date AND NEW.next_follow_up IS NOT DISTINCT FROM OLD.next_follow_up) THEN
    NEW.next_follow_up := NEW.last_contact_date + 7;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_follow_up BEFORE INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_follow_up();

-- Seed demo data + default planner tasks for every new user
CREATE OR REPLACE FUNCTION public.seed_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := NEW.id;
BEGIN
  INSERT INTO public.applications (user_id, company, title, website, location, arrangement, salary_min, salary_max, applied_date, last_contact_date, status, recruiter_name, notes, cv_version, interview_date, is_demo) VALUES
  (u,'Nordljus Digital (DEMO)','Junior Frontend Developer','https://example.com','Stockholm','Hybrid',34000,40000,current_date-12,current_date-9,'APPLIED','Anna Demo','DEMO DATA – fictional company.','CV v2 – React',NULL,true),
  (u,'Pixelfjord AB (DEMO)','Frontend Developer (React)','https://example.com','Stockholm','On-site',38000,44000,current_date-20,current_date-3,'INTERVIEWING','Erik Demo','DEMO DATA – fictional company.','CV v2 – React',now()+interval '4 days',true),
  (u,'Molnbyrån Consulting (DEMO)','Web Developer','https://example.com','Remote – Europe','Remote',36000,42000,NULL,NULL,'SAVED',NULL,'DEMO DATA – fictional company.',NULL,NULL,true),
  (u,'Kodstugan Tech (DEMO)','Junior Software Developer','https://example.com','Uppsala','Hybrid',33000,38000,current_date-30,current_date-5,'OFFER','Sara Demo','DEMO DATA – fictional company.','CV v1 – General',NULL,true),
  (u,'Blåval Studios (DEMO)','Frontend Developer','https://example.com','Göteborg','On-site',35000,41000,current_date-40,current_date-25,'CLOSED',NULL,'DEMO DATA – fictional company. Position filled.','CV v1 – General',NULL,true),
  (u,'Ekorre Systems (DEMO)','Junior Frontend Developer (Vue/React)','https://example.com','Stockholm','Hybrid',32000,37000,current_date-8,current_date-8,'APPLIED','Johan Demo','DEMO DATA – fictional company.','CV v3 – TypeScript',NULL,true);
  INSERT INTO public.planner_tasks (user_id,label,position) VALUES
  (u,'Find 3 suitable job opportunities',1),(u,'Apply for 1–2 relevant jobs',2),(u,'Check upcoming follow-ups',3),
  (u,'Practise JavaScript or React for 30 minutes',4),(u,'Work on one portfolio improvement',5),(u,'Review my weekly progress',6);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_seed AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.seed_new_user();