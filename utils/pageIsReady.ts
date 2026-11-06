/** Safari has no idle callback, so it waits this long once the page is ready. */
const NO_IDLE_WAIT_MS = 1000;

/** A page that never hydrates must still report its errors. */
const MAX_HYDRATION_WAIT_MS = 10000;

const HYDRATED = "app-hydrated";

type Page = Window & { __appHydrated?: boolean };

/** The root's first effect calls this: hydration is over. */
export function markHydrated() {
  (window as Page).__appHydrated = true;
  window.dispatchEvent(new Event(HYDRATED));
}

const hydrated = () =>
  new Promise<void>((resolve) => {
    if ((window as Page).__appHydrated) {
      resolve();
      return;
    }
    window.addEventListener(HYDRATED, () => resolve(), { once: true });
    setTimeout(resolve, MAX_HYDRATION_WAIT_MS);
  });

const loaded = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  });

/**
 * Resolves when the page has loaded, React has hydrated it, and the phone is
 * idle. For work the shopper does not wait for, such as analytics and error
 * reporting: on a slow line it would take the bandwidth of the page's photos.
 *
 * It must wait for hydration, and an idle callback alone does not. React
 * hydrates in small slices, and the browser counts the gaps between them as
 * idle, so work started on "idle" ran in the middle of hydration and delayed it.
 */
export const pageIsReady = async () => {
  await Promise.all([loaded(), hydrated()]);
  await new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 3000 });
    } else {
      setTimeout(resolve, NO_IDLE_WAIT_MS);
    }
  });
};
