import { expect, it } from "vitest";
import { readResponseText } from "./use-session";
it("adapts native response deltas and requires completion", async () => {
  let text = "";
  const response = new Response(
    'data: {"type":"response.output_text.delta","delta":"Career"}\n\ndata: {"type":"response.completed"}\n\n',
  );
  await readResponseText(response, new AbortController().signal, (d) => {
    text += d;
  });
  expect(text).toBe("Career");
  await expect(
    readResponseText(
      new Response('data: {"type":"response.output_text.delta","delta":"Partial"}\n\n'),
      new AbortController().signal,
      () => undefined,
    ),
  ).rejects.toThrow("incomplete");
});
it("stops on a terminal stream failure without replay", async () => {
  await expect(
    readResponseText(
      new Response('data: {"type":"error","error":{"code":"payment_required"}}\n\n'),
      new AbortController().signal,
      () => undefined,
    ),
  ).rejects.toThrow("credits");
});
