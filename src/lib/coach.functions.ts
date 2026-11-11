import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Input = { question: string; answer: string; lang: "en" | "sv" };

export const coachFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Input) => {
    const question = String(d?.question ?? "").slice(0, 1000).trim();
    const answer = String(d?.answer ?? "").slice(0, 6000).trim();
    if (!question || !answer) throw new Error("Question and answer are required");
    return { question, answer, lang: d?.lang === "sv" ? "sv" : "en" } as Input;
  })
  .handler(async ({ data }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const language = data.lang === "sv" ? "Swedish" : "English";
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: `You are a supportive, honest interview coach for a junior software developer in Sweden. Reply in ${language}. Give concise feedback in three short sections: Strengths, Improvements, Suggested stronger answer outline. Never invent experience, employers, achievements or skills the candidate did not mention; suggest where they could add their own real examples instead. Max 220 words.`,
        input: `Interview question: ${data.question}\n\nCandidate answer:\n${data.answer}`,
      });
      const feedback = res.output
        .flatMap((o) => (o.type === "message" ? o.content : []))
        .map((c) => (c.type === "output_text" ? c.text : ""))
        .join("").trim();
      return { feedback };
    } catch (e) {
      if (e instanceof GatewayError) return { error: e.code === "payment_required" ? "credits" : "failed" };
      throw e;
    }
  });
