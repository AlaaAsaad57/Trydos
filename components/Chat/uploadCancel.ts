import { useSyncExternalStore } from "react";

// The chat uploads that are still running, keyed by the `mid` of their pending
// bubble. The bubble reads this to show its cancel button only while the file
// is still going up. Once the upload ends, the message is already on its way to
// the chat backend, and hiding the bubble then would hide a message that was
// sent.

type RunningUpload = { controller: AbortController; onCancel: () => void };

const running = new Map<string, RunningUpload>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Registers the upload for bubble `mid`. `onCancel` removes the bubble; it runs
 * at once when the sender cancels, so the bubble does not wait for the request
 * to stop. Returns the signal to pass to the upload.
 */
export function startUpload(mid: string, onCancel: () => void): AbortSignal {
  const controller = new AbortController();
  running.set(mid, { controller, onCancel });
  notify();
  return controller.signal;
}

/** The upload for `mid` ended, whatever the result. Its cancel button goes. */
export function finishUpload(mid: string) {
  if (running.delete(mid)) notify();
}

/** Stops the upload for `mid` and removes its bubble. */
export function cancelUpload(mid: string) {
  const upload = running.get(mid);
  if (!upload) return;
  running.delete(mid);
  upload.controller.abort();
  upload.onCancel();
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether the upload for `mid` is still running. */
export function useUploadRunning(mid: string) {
  return useSyncExternalStore(
    subscribe,
    () => running.has(mid),
    () => false,
  );
}
