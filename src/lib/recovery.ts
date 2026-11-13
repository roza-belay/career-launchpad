/** Retain a successful first step while the same operation retries its second step. */
export function resumableWrite<T>(prepare: () => Promise<T>, finish: (value: T) => Promise<void>) {
  let prepared: { value: T } | undefined;
  let running: Promise<void> | undefined;
  return () => {
    if (running) return running;
    running = (async () => {
      if (!prepared) prepared = { value: await prepare() };
      await finish(prepared.value);
      prepared = undefined;
    })().finally(() => { running = undefined; });
    return running;
  };
}