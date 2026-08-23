// Lets a test watch where a component sent the browser.
//
// Several auth surfaces end in a full navigation rather than a router push:
// dismissing the session-expired prompt reloads the page so server-rendered
// markup stops showing the old account, and a guest on a seller route is sent
// to the storefront. Those are the whole point of the handler, so a test has to
// be able to see them.
//
// jsdom implements neither `location.reload()` nor assigning `location.href`:
// both print "Not implemented: navigation" and do nothing, so the call cannot
// be observed and the noise buries the real output. `window.location` is
// configurable, so the honest way is to put a recording stand-in in its place
// for the test and take it away again after.
//
//   const location = stubLocation({ pathname: "/gb-en/seller/products" });
//   ...
//   expect(location.href, "...").toBe("/");
//   expect(location.reload, "...").toHaveBeenCalled();
//
// Always restore in `afterEach` — the window is shared by every test in the file.

export type LocationStub = {
  pathname: string;
  /** The address the component navigated to, or null if it never did. */
  href: string | null;
  reload: ReturnType<typeof vi.fn>;
  assign: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
};

let original: PropertyDescriptor | undefined;

/** Replace `window.location` with something that records instead of navigating. */
export function stubLocation({
  // Defaults to the address the window is really on, so the stand-in does not
  // quietly change the locale: `utils/functions` reads the language out of the
  // first path segment, and a stand-in stuck on "/gb-en" makes every
  // non-English render come back in English.
  pathname = window.location.pathname,
  origin = "http://localhost:3000",
}: { pathname?: string; origin?: string } = {}): LocationStub {
  original ??= Object.getOwnPropertyDescriptor(window, "location");

  const record: LocationStub = {
    pathname,
    href: null,
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn(),
  };

  const stub = {
    get pathname() {
      return record.pathname;
    },
    // Setting `href` is a navigation, so it is recorded rather than followed.
    // Reading it still answers the address the window is on: a real navigation
    // has not happened, and code that resolves a relative URL against
    // `location.href` — `next/image` does — needs an absolute one back.
    get href() {
      return `${origin}${record.pathname}`;
    },
    set href(value: string) {
      record.href = value;
    },
    origin,
    search: "",
    hash: "",
    reload: record.reload,
    assign: record.assign,
    replace: record.replace,
    toString() {
      return `${origin}${record.pathname}`;
    },
  };

  Object.defineProperty(window, "location", {
    configurable: true,
    value: stub,
  });

  return record;
}

/** Give the window its own address back. */
export function restoreLocation(): void {
  if (!original) return;
  Object.defineProperty(window, "location", original);
  original = undefined;
}
