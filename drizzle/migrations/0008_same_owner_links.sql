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

CREATE TRIGGER follow_ups_same_owner
  BEFORE INSERT OR UPDATE OF application_id, user_id ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner_link();
CREATE TRIGGER vacancies_same_owner
  BEFORE INSERT OR UPDATE OF application_id, user_id ON public.vacancies
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner_link();
CREATE TRIGGER learning_goals_same_owner
  BEFORE INSERT OR UPDATE OF skill_id, user_id ON public.learning_goals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner_link();
CREATE TRIGGER task_completions_same_owner
  BEFORE INSERT OR UPDATE OF task_id, user_id ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner_link();