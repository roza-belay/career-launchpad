CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  short_description text,
  description text,
  category text,
  technologies text[] NOT NULL DEFAULT '{}',
  role text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','PUBLISHED')),
  github_url text,
  demo_url text,
  docs_url text,
  screenshots text[] NOT NULL DEFAULT '{}',
  features text[] NOT NULL DEFAULT '{}',
  challenges text,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, title)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects select" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own projects insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own projects update" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own projects delete" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX projects_user_idx ON public.projects(user_id);

INSERT INTO public.projects (user_id, title, short_description, category, technologies, role, status, features)
SELECT u.id, 'Career Launchpad',
  'A personal career management application developed using Lovable and AI-assisted development.',
  'Web application',
  ARRAY['React','TypeScript','TanStack Start','TanStack Query','Tailwind CSS','shadcn/ui','Recharts','Vite','Lovable Cloud (PostgreSQL, Auth, Row Level Security)'],
  'Product owner and developer, built with Lovable and AI-assisted development',
  'IN_PROGRESS',
  ARRAY['Dashboard and job application tracking','Application status management','Follow-up reminders','Daily career planner','Swedish and English language switching','Light and Dark Mode','Editable Swedish and English CV versions']
FROM auth.users u
ON CONFLICT (user_id, title) DO NOTHING;

INSERT INTO public.projects (user_id, title, short_description, description, category, technologies, status, features)
SELECT u.id, 'POS Payment Terminal Integration',
  'My graduation project at Jensen Yrkeshögskola.',
  'Developed a POS system with payment terminal integration and compared On-device and Off-device integration architectures.',
  'Android application',
  ARRAY['Kotlin','Android Studio','Verifone PSDK','Coroutines','StateFlow','TCP/IP','Room'],
  'COMPLETED',
  ARRAY['Developed a POS system with payment terminal integration','Compared On-device and Off-device integration architectures','Implemented payment flows: purchase, refund, cancellation and instalments','Worked with external hardware, including printers and scanners','Worked with terminal communication and TCP/IP']
FROM auth.users u
ON CONFLICT (user_id, title) DO NOTHING;

CREATE POLICY "own screenshots read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own screenshots insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own screenshots delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);