CREATE TABLE public.cover_letters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  language text NOT NULL DEFAULT 'sv',
  company text,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cover_letters TO authenticated;
GRANT ALL ON public.cover_letters TO service_role;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cover letters" ON public.cover_letters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.message_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'FOLLOW_UP',
  language text NOT NULL DEFAULT 'sv',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own message templates" ON public.message_templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.profile_links (
  user_id uuid NOT NULL DEFAULT auth.uid() PRIMARY KEY,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  pos_docs_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_links TO authenticated;
GRANT ALL ON public.profile_links TO service_role;
ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile links" ON public.profile_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enforce_same_owner_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_id uuid;
  ok boolean;
BEGIN
  IF TG_TABLE_NAME = 'follow_ups' THEN
    parent_id := NEW.application_id;
    SELECT EXISTS (SELECT 1 FROM public.applications WHERE id = parent_id AND user_id = NEW.user_id) INTO ok;
  ELSIF TG_TABLE_NAME = 'vacancies' THEN
    parent_id := NEW.application_id;
    IF parent_id IS NULL THEN RETURN NEW; END IF;
    SELECT EXISTS (SELECT 1 FROM public.applications WHERE id = parent_id AND user_id = NEW.user_id) INTO ok;
  ELSIF TG_TABLE_NAME = 'learning_goals' THEN
    parent_id := NEW.skill_id;
    IF parent_id IS NULL THEN RETURN NEW; END IF;
    SELECT EXISTS (SELECT 1 FROM public.skills WHERE id = parent_id AND user_id = NEW.user_id) INTO ok;
  ELSIF TG_TABLE_NAME = 'task_completions' THEN
    parent_id := NEW.task_id;
    SELECT EXISTS (SELECT 1 FROM public.planner_tasks WHERE id = parent_id AND user_id = NEW.user_id) INTO ok;
  ELSIF TG_TABLE_NAME = 'cover_letters' THEN
    parent_id := NEW.application_id;
    IF parent_id IS NULL THEN RETURN NEW; END IF;
    SELECT EXISTS (SELECT 1 FROM public.applications WHERE id = parent_id AND user_id = NEW.user_id) INTO ok;
  ELSE
    RETURN NEW;
  END IF;
  IF NOT ok THEN
    RAISE EXCEPTION 'cross-account link not allowed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_same_owner_link() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER cover_letters_same_owner
  BEFORE INSERT OR UPDATE OF application_id, user_id ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner_link();