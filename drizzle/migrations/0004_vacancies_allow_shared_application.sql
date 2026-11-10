ALTER TABLE public.vacancies DROP CONSTRAINT IF EXISTS vacancies_application_id_key;
CREATE INDEX IF NOT EXISTS vacancies_application_idx ON public.vacancies(application_id);