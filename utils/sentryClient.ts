type Sdk = typeof import("./sentrySdk");

let loaded: Sdk | null = null;
let loading: Promise<Sdk> | null = null;

/** The SDK when it is here, for code that must not wait for it. */
export const sentryIfLoaded = () => loaded;

/**
 * Sentry in the browser, loaded and started on first use.
 *
 * The SDK was about 80 KB of the JS every page needed before it could hydrate.
 * instrumentation-client.ts asks for it when the page is ready, and an error
 * that comes first asks for it at once, so no report waits for the page. The
 * two steps stay together here on purpose: a report sent to an SDK that was
 * loaded but not started is dropped with no error.
 */
export function loadSentry(): Promise<Sdk> {
  loading ??= import("./sentrySdk")
    .then((sdk) => {
      sdk.init({
        dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,
        // Logs disabled to trim always-on client work; error/perf reporting unaffected.
        enableLogs: false,

        // Off, so no cookie and no IP address rides along with a browser event
        // (readiness A1-10).
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
        sendDefaultPii: false,

        // Keeps staging and production events apart. The browser only sees
        // NEXT_PUBLIC_ values, so the public copy of the setting is read here.
        environment:
          process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
          process.env.NEXT_PUBLIC_VERCEL_ENV ||
          process.env.NODE_ENV,
      });
      loaded = sdk;
      return sdk;
    })
    .catch((error) => {
      // A chunk that could not load may load on the next try.
      loading = null;
      throw error;
    });
  return loading;
}
