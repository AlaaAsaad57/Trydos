// The one running server, shared between global setup and global teardown.
//
// Playwright runs both of those in the same process, so a module-level value is
// how one hands the server to the other. It is deliberately the only mutable
// state in the harness.
//
// `stopServer()` is safe to call when nothing was started — an unconfigured run
// never starts a server, and teardown still runs.

type Stop = () => Promise<void>;

let stop: Stop | null = null;

export const setStopServer = (fn: Stop): void => {
  stop = fn;
};

export const stopServer = async (): Promise<void> => {
  if (!stop) return;
  const fn = stop;
  stop = null;
  await fn();
};
