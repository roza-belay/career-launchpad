import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  actionSchema,
  completedAnswers,
  cvSchema,
  editableFields,
  interviewSchema,
  optimizationSchema,
  privateCv,
  summarySchema,
  taskSchema,
} from "./contracts";

export const aiTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => taskSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { selectedContext, factualInstructions } = await import("./context.server");
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const selected = await selectedContext(context.supabase, context.userId, data.context);
      const source = data.operation === "optimize" ? privateCv(data.source) : undefined;
      const count = completedAnswers(data.turns);
      if (data.operation === "interview" && (count > 5 || !data.role.trim()))
        throw new Error("Invalid session");
      const instructions: Record<typeof data.operation, string> = {
        actions:
          'Return JSON {"actions":[{"title":"...","details":"..."}]} with at most six concrete steps grounded in the conversation. No dates assumed.',
        optimize:
          'Return JSON {"analysis":"...","supported":["..."],"missing":["..."],"learning":["..."],"suggestions":[{"path":"...","original":"...","replacement":"...","reason":"..."}]}. Suggestions may address only supplied editableFields, copying original exactly. Preserve every factual detail and date, including 400 YH credits if present. Missing keywords are unknown qualifications, not claims to insert. No scores.',
        import:
          "Return JSON structured CV with keys name,headline,phone,email,links:[{label,url}],profileTitle,profile,sections:[{title,entries:[{heading,sub,text,bullets:[string]}]}],footer. Extract only explicit facts from supplied text, preserve dates and education verbatim. Missing fields must be empty strings or arrays. Do not add claims or translate content.",
        interview: `Return JSON {"feedback":"...","question":"..."}. ${count === 0 ? "Generate the first realistic question; feedback empty." : "Give feedback on the latest answer: strengths, improvements and a stronger real-experience outline."} ${count >= 5 ? "question must be empty; five answers completed." : "Generate the next adaptive question, without repeating earlier questions."} Target role and focus are supplied.`,
        summary:
          'Return JSON {"summary":"..."} with practiced topics, strengths grounded in actual answers and next practice priorities. No numerical readiness score.',
      };
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `${factualInstructions} Reply in ${data.lang === "sv" ? "Swedish" : "English"}. ${instructions[data.operation]}`,
        input: `Return JSON.\n${JSON.stringify({ context: selected, source, editableFields: source ? editableFields(source) : undefined, text: data.text, role: data.role, focus: data.focus, turns: data.turns })}`,
        text: { format: { type: "json_object" } },
      });
      const text = response.output
        .flatMap((o) => (o.type === "message" ? o.content : []))
        .map((c) => (c.type === "output_text" ? c.text : ""))
        .join("");
      if (text.length > 80000) throw new Error("Output too long");
      const raw: unknown = JSON.parse(text);
      switch (data.operation) {
        case "actions":
          return { kind: "actions" as const, value: actionSchema.parse(raw) };
        case "optimize": {
          const value = optimizationSchema.parse(raw);
          const fields = source ? editableFields(source) : {};
          value.suggestions = value.suggestions.filter((s) => fields[s.path] === s.original);
          return { kind: "optimize" as const, value };
        }
        case "import":
          return { kind: "import" as const, value: cvSchema.parse(raw) };
        case "interview":
          return { kind: "interview" as const, value: interviewSchema.parse(raw) };
        case "summary":
          return { kind: "summary" as const, value: summarySchema.parse(raw) };
      }
    } catch (e) {
      if (e instanceof GatewayError)
        return {
          kind: "error" as const,
          error: e.code === "payment_required" ? ("credits" as const) : ("failed" as const),
        };
      return { kind: "error" as const, error: "failed" as const };
    }
  });
