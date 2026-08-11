// Stand-in for the framework's server-request reader (next/headers).
//
// Use it like this, at the top of a test file:
//
//   vi.mock("next/headers", () => makeNextHeadersMock());
//
// It is hand-written: nothing here imports next/headers, so a test file never
// pulls the real server-only module into the browser-like test environment.
//
// It covers what next/headers makes available to this app: `cookies`,
// `headers` and `draftMode`. All three are async in the app's version of the
// framework, which is why the real code always awaits them.
//
// ---------------------------------------------------------------------------
// Writing cookies
//
// The app writes cookies the object way — `store.set({ name, value, ...options })`
// — and the options are the whole point: whether a cookie is readable by the
// browser, how long it lives, and which requests carry it. So this stand-in
// keeps every option it was handed, on `__writes`, where a test can read it
// back. The older two-argument form still works.
//
// It can also be told to refuse writes, because refusing is a real state the app
// handles: during a plain page render the framework does not allow a cookie to
// be written, and the code under test probes for exactly that before it spends
// anything it cannot replace.

/** The cookies or headers a test wants to start with, keyed by name. */
export type HeaderBag = Record<string, string>;

/** One recorded cookie write, with whatever options came with it. */
export type RecordedWrite = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

export type NextHeadersMockOptions = {
  cookies?: HeaderBag;
  headers?: HeaderBag;
  /** Start with writes refused (as in a plain page render). */
  failWrites?: boolean;
};

/**
 * Build a fresh stand-in for next/headers.
 *
 * Pass a starting set of cookies and headers if the code under test expects
 * some to be there. Nothing reaches a real request.
 */
export function makeNextHeadersMock(initial: NextHeadersMockOptions = {}) {
  const cookieJar: HeaderBag = { ...initial.cookies };
  const headerBag: HeaderBag = { ...initial.headers };

  /** Every write, in order, with its options — what the cookie tests read. */
  const writes: RecordedWrite[] = [];
  /** Every cookie name deleted, in order. */
  const deletes: string[] = [];

  let failWrites = Boolean(initial.failWrites);

  const cookieStore = {
    get: vi.fn((name: string) =>
      name in cookieJar ? { name, value: cookieJar[name] } : undefined,
    ),
    getAll: vi.fn(() =>
      Object.entries(cookieJar).map(([name, value]) => ({ name, value })),
    ),
    has: vi.fn((name: string) => name in cookieJar),
    // Both shapes: set("a", "b") and set({ name, value, ...options }).
    set: vi.fn((...args: any[]) => {
      if (failWrites) {
        // What the framework does during a plain page render. The message is
        // close enough to the real one to read the same way in a failure.
        throw new Error(
          "Cookies can only be modified in a Server Action or Route Handler.",
        );
      }

      let name: string;
      let value: string;
      let options: Record<string, unknown> = {};

      if (typeof args[0] === "object" && args[0] !== null) {
        ({ name, value = "", ...options } = args[0]);
      } else {
        [name, value = ""] = args;
        options = args[2] ?? {};
      }

      cookieJar[name] = value;
      writes.push({ name, value, options });
    }),
    delete: vi.fn((name: string) => {
      delete cookieJar[name];
      deletes.push(name);
    }),
  };

  const headerStore = {
    get: vi.fn((name: string) => headerBag[name.toLowerCase()] ?? null),
    has: vi.fn((name: string) => name.toLowerCase() in headerBag),
    entries: vi.fn(() => Object.entries(headerBag)[Symbol.iterator]()),
    forEach: vi.fn((fn: (value: string, key: string) => void) => {
      Object.entries(headerBag).forEach(([key, value]) => fn(value, key));
    }),
  };

  return {
    // The bags themselves, so a test can look at what the code wrote.
    __cookieJar: cookieJar,
    __headerBag: headerBag,

    /** Every cookie write, with its options. Read this, not just the jar. */
    __writes: writes,
    /** Every cookie name the code deleted, in order. */
    __deletes: deletes,

    /** The last write for a name, or undefined. */
    __lastWrite: (name: string) =>
      [...writes].reverse().find((w) => w.name === name),

    /** Refuse or allow cookie writes from here on. */
    __setFailWrites: (fail: boolean) => {
      failWrites = fail;
    },

    /**
     * Put the stand-in back how it started: empty jar, no recorded writes or
     * deletes, writes allowed, and every spy's call history forgotten.
     *
     * Call this between tests. `vi.mock` runs its factory once per file, so
     * without it one test's cookies and call counts are still there in the next
     * — which is exactly what a test counting writes must not inherit.
     */
    __reset: (next: NextHeadersMockOptions = {}) => {
      for (const key of Object.keys(cookieJar)) delete cookieJar[key];
      Object.assign(cookieJar, next.cookies ?? {});
      for (const key of Object.keys(headerBag)) delete headerBag[key];
      Object.assign(headerBag, next.headers ?? {});

      writes.length = 0;
      deletes.length = 0;
      failWrites = Boolean(next.failWrites);

      cookieStore.get.mockClear();
      cookieStore.getAll.mockClear();
      cookieStore.has.mockClear();
      cookieStore.set.mockClear();
      cookieStore.delete.mockClear();
      headerStore.get.mockClear();
      headerStore.has.mockClear();
    },

    cookies: vi.fn(async () => cookieStore),
    headers: vi.fn(async () => headerStore),
    draftMode: vi.fn(async () => ({
      isEnabled: false,
      enable: vi.fn(),
      disable: vi.fn(),
    })),
  };
}
