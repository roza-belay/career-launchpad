import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { resumableWrite } from "@/lib/recovery";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translate } from "@/lib/i18n/core";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Database } from "@/integrations/supabase/types";

export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInput = Database["public"]["Tables"]["applications"]["Insert"];
export type FollowUp = Database["public"]["Tables"]["follow_ups"]["Row"];
export type PlannerTask = Database["public"]["Tables"]["planner_tasks"]["Row"];
export type WeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Row"];

const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : translate("common.error"));

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ApplicationInput }) => {
      const q = id ? supabase.from("applications").update(values).eq("id", id) : supabase.from("applications").insert(values);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); toast.success(translate("apps.savedToast")); },
    onError: fail,
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ApplicationInput> }) => {
      const { error } = await supabase.from("applications").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: fail,
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("applications").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); toast.success(translate("common.deleted")); },
    onError: fail,
  });
}

export function useFollowUps() {
  return useQuery({
    queryKey: ["follow_ups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("follow_ups").select("*").order("followed_up_on", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Records a confirmed follow-up: logs history, sets last contact = today (trigger moves next follow-up +7 days). */
export function useConfirmFollowUp() {
  const qc = useQueryClient();
  const pending = useRef(new Map<string, () => Promise<void>>());
  return useMutation({
    mutationFn: async ({ application_id, date, note }: { application_id: string; date: string; note?: string }) => {
      const key = JSON.stringify([application_id, date, note]);
      let run = pending.current.get(key);
      if (!run) {
        run = resumableWrite(async () => {
          const { error } = await supabase.from("follow_ups").insert({ application_id, followed_up_on: date, note: note || null });
          if (error) throw error;
          return application_id;
        }, async (id) => {
          const { error } = await supabase.from("applications").update({ last_contact_date: date }).eq("id", id);
          if (error) throw new Error(translate("common.partialSave"));
        });
        pending.current.set(key, run);
      }
      try { await run(); pending.current.delete(key); }
      finally {
        qc.invalidateQueries({ queryKey: ["applications"] });
        qc.invalidateQueries({ queryKey: ["follow_ups"] });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["follow_ups"] });
      toast.success(translate("fu.recorded"));
    },
    onError: fail,
  });
}

export function usePlanner(today: string, week: string) {
  return useQuery({
    queryKey: ["planner", today, week],
    queryFn: async () => {
      const [t, c, g] = await Promise.all([
        supabase.from("planner_tasks").select("*").order("position"),
        supabase.from("task_completions").select("*").gte("done_on", week),
        supabase.from("weekly_goals").select("*").eq("week_start", week).order("created_at"),
      ]);
      if (t.error) throw t.error;
      if (c.error) throw c.error;
      if (g.error) throw g.error;
      return { tasks: t.data, completions: c.data, goals: g.data };
    },
  });
}

export function usePlannerMutation<T>(fn: (v: T) => Promise<{ error: unknown }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: T) => {
      const { error } = await fn(v);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planner"] }),
    onError: fail,
  });
}

export type CvDocument = Database["public"]["Tables"]["cv_documents"]["Row"];

export function useCvDocuments() {
  return useQuery({
    queryKey: ["cv_documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cv_documents").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useCvMutation<T>(fn: (v: T) => Promise<{ error: unknown }>, successKey?: MessageKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: T) => {
      const { error } = await fn(v);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cv_documents"] }); if (successKey) toast.success(translate(successKey)); },
    onError: fail,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectMutation<T>(fn: (v: T) => Promise<{ error: unknown }>, successKey?: MessageKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: T) => {
      const { error } = await fn(v);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); if (successKey) toast.success(translate(successKey)); },
    onError: fail,
  });
}

/** Short-lived signed URLs for private screenshot paths. */
export function useScreenshotUrls(paths: string[]) {
  return useQuery({
    queryKey: ["shot-urls", paths],
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("project-screenshots").createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries(data.map((d) => [d.path ?? "", d.signedUrl]));
    },
  });
}

export function useVacancies() {
  return useQuery({
    queryKey: ["vacancies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vacancies").select("*").order("saved_on", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useVacancyMutation<T>(fn: (v: T) => Promise<{ error: unknown }>, successKey?: MessageKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: T) => {
      const { error } = await fn(v);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vacancies"] });
      qc.invalidateQueries({ queryKey: ["applications"] });
      if (successKey) toast.success(translate(successKey));
    },
    onError: fail,
  });
}

export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type LearningGoal = Database["public"]["Tables"]["learning_goals"]["Row"];
export type InterviewQuestion = Database["public"]["Tables"]["interview_questions"]["Row"];

export function useCareerProfile() {
  return useQuery({
    queryKey: ["career_profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("career_profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const [s, g] = await Promise.all([
        supabase.from("skills").select("*").order("created_at").order("name"),
        supabase.from("learning_goals").select("*").order("done").order("target_date", { nullsFirst: false }),
      ]);
      if (s.error) throw s.error;
      if (g.error) throw g.error;
      return { skills: s.data, goals: g.data };
    },
  });
}

export function useInterviewQuestions() {
  return useQuery({
    queryKey: ["interview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interview_questions").select("*").order("created_at").order("preset_key");
      if (error) throw error;
      return data;
    },
  });
}

/** Generic mutation that invalidates one query key. */
export function useKeyedMutation<T>(key: string, fn: (v: T) => Promise<{ error: unknown }>, successKey?: MessageKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: T) => {
      const { error } = await fn(v);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [key] }); if (successKey) toast.success(translate(successKey)); },
    onError: fail,
  });
}
