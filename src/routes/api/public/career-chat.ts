import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { coachSchema } from "@/lib/ai/contracts";

export const Route = createFileRoute("/api/public/career-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin)
          return new Response(null, { status: 403 });
        if (Number(request.headers.get("content-length") ?? 0) > 100000)
          return new Response(null, { status: 413 });
        const bearer = request.headers.get("authorization");
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!bearer?.startsWith("Bearer ") || !url || !key)
          return new Response(null, { status: 401 });
        const client = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: bearer } },
        });
        const user = await client.auth.getUser(bearer.slice(7));
        if (user.error || !user.data.user) return new Response(null, { status: 401 });
        const text = await request.text();
        if (text.length > 100000) return new Response(null, { status: 413 });
        let input;
        try {
          input = coachSchema.parse(JSON.parse(text));
        } catch {
          return new Response(null, { status: 400 });
        }
        const { streamResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
        const { selectedContext, factualInstructions } = await import("@/lib/ai/context.server");
        try {
          const context = await selectedContext(client, user.data.user.id, input.context);
          const stream = await streamResponse(
            {
              model: "openai/gpt-6-astra",
              instructions: `${factualInstructions} You are Career Launchpad's career coach. Reply in ${input.lang === "sv" ? "Swedish" : "English"}. Help clarify goals, explore suitable paths and propose actionable steps. Ask focused questions. Keep each reply under 350 words.`,
              input: JSON.stringify({ context, conversation: input.turns }),
            },
            { signal: request.signal },
          );
          return stream.toResponse({ headers: { "Cache-Control": "no-store" } });
        } catch (e) {
          return Response.json(
            {
              error:
                e instanceof GatewayError && e.code === "payment_required" ? "credits" : "failed",
            },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
