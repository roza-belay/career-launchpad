CREATE TABLE public.career_profiles (
 user_id uuid PRIMARY KEY DEFAULT auth.uid(),
 preferred_roles text[] NOT NULL DEFAULT '{}',
 headline text NOT NULL DEFAULT '',
 summary text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_profiles TO authenticated;
GRANT ALL ON public.career_profiles TO service_role;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own career profile" ON public.career_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.seed_developer_expansion(_uid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
INSERT INTO public.skills(user_id,name,category,is_custom,progress,level)
SELECT _uid,s.name,s.cat,false,0,NULL FROM (VALUES
('Kotlin','BACKEND'),('Python','BACKEND'),('Node.js','BACKEND'),('SQL','BACKEND'),('Database Fundamentals','BACKEND'),('Server-side Development','BACKEND'),
('API Design','API'),('API Testing','API'),('JSON','API'),('Authentication and Authorization','API'),
('AI API Integration','AI'),('Large Language Models (LLMs)','AI'),('Prompt Engineering','AI'),('AI Application Development','AI'),
('Unit Testing','TESTING'),('Integration Testing','TESTING'),('Automated Testing','TESTING'),('Test-Driven Development (TDD)','TESTING'),
('CI/CD','CLOUD'),('Docker','CLOUD'),('Cloud Fundamentals','CLOUD'),('Deployment and Hosting','CLOUD'),
('Android Development','MOBILE'),('Mobile App Integration','MOBILE')
) s(name,cat) WHERE NOT EXISTS (SELECT 1 FROM public.skills k WHERE k.user_id=_uid AND lower(trim(k.name))=lower(s.name)) ON CONFLICT (user_id,name) DO NOTHING;
INSERT INTO public.interview_questions(user_id,category,preset_key)
SELECT _uid,q.cat,q.k FROM (VALUES
('BACKEND','backend1'),('BACKEND','backend2'),('KOTLIN','kotlin1'),('KOTLIN','kotlin2'),('PYTHON','python1'),('PYTHON','python2'),('NODEJS','node1'),('NODEJS','node2'),('REST','rest1'),('REST','rest2'),('SQL','sql1'),('SQL','sql2'),('AI','ai1'),('AI','ai2'),('TESTING','testing1'),('TESTING','testing2'),('ANDROID','android1'),('ANDROID','android2'),('GIT','git1'),('GIT','git2')
) q(cat,k) WHERE NOT EXISTS (SELECT 1 FROM public.interview_questions i WHERE i.user_id=_uid AND i.preset_key=q.k);
END $$;
REVOKE ALL ON FUNCTION public.seed_developer_expansion(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_developer_expansion(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.seed_skills_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
PERFORM public.seed_skills_and_questions(NEW.id);
PERFORM public.seed_developer_expansion(NEW.id);
RETURN NEW;
END $$;