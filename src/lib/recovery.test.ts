import { expect, it, vi } from "vitest";
import { resumableWrite } from "./recovery";

it("retries linking without repeating the successful create", async () => {
  const prepare = vi.fn(async () => "application-1");
  const finish = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
  const run = resumableWrite(prepare, finish);
  await expect(run()).rejects.toThrow("offline");
  await run();
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(finish).toHaveBeenNthCalledWith(2, "application-1");
});

it("shares an in-flight write instead of creating duplicates", async () => {
  const prepare = vi.fn(async () => "follow-up-1");
  const finish = vi.fn(async () => undefined);
  const run = resumableWrite(prepare, finish);
  await Promise.all([run(), run()]);
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(finish).toHaveBeenCalledTimes(1);
});