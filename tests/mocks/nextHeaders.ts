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

/** The cookies or headers a test wants to start with, keyed by name. */
export type HeaderBag = Record<string, string>;

/**
 * Build a fresh stand-in for next/headers.
 *
 * Pass a starting set of cookies and headers if the code under test expects
 * some to be there. Nothing reaches a real request.
 */
export function makeNextHeadersMock(
  initial: { cookies?: HeaderBag; headers?: HeaderBag } = {},
) {
  const cookieJar: HeaderBag = { ...initial.cookies };
  const headerBag: HeaderBag = { ...initial.headers };

  const cookieStore = {
    get: vi.fn((name: string) =>
      name in cookieJar ? { name, value: cookieJar[name] } : undefined,
    ),
    getAll: vi.fn(() =>
      Object.entries(cookieJar).map(([name, value]) => ({ name, value })),
    ),
    has: vi.fn((name: string) => name in cookieJar),
    set: vi.fn((name: string, value: string) => {
      cookieJar[name] = value;
    }),
    delete: vi.fn((name: string) => {
      delete cookieJar[name];
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

    cookies: vi.fn(async () => cookieStore),
    headers: vi.fn(async () => headerStore),
    draftMode: vi.fn(async () => ({
      isEnabled: false,
      enable: vi.fn(),
      disable: vi.fn(),
    })),
  };
}
