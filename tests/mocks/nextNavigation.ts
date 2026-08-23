// Stand-in for the App Router hooks (next/navigation).
//
// WHY EVERY COMPONENT TEST NEEDS THIS
// 86 files under components/ read the route through these hooks. The real ones
// only work inside a running App Router, so outside one they either throw or
// hand back nothing. Without a stand-in, nearly every component phase would
// start by writing its own — which is the thing the render helper is meant to
// stop.
//
// This one is registered for the whole test run in tests/setup.ts, so a test
// file does not have to ask for it. A test that wants something else can still
// replace it for its own file in the usual way.
//
// HOW THE ROUTE IS SET
// The hooks read one shared route, which tests/render.tsx writes before it
// renders. tests/setup.ts puts it back to the default after every test, so one
// test can never leave its route behind for the next one.
//
//   renderWithProviders(<Card />, { language: "ar", path: "/products/shoe" });
//   // useParams()      -> { lang: "gb-ar" }
//   // usePathname()    -> "/gb-ar/products/shoe"
//
// To check where a component sent the user, read the spies:
//
//   import { routerSpies } from "tests/mocks/nextNavigation";
//   expect(routerSpies.push).toHaveBeenCalledWith("/gb-en/cart");

/** The locale segment this app puts first in every path: country-language. */
export const DEFAULT_LANG_SEGMENT = "gb-en";

/** What the hooks hand back. */
export type TestRoute = {
  /** The whole path, locale segment included. */
  pathname: string;
  /** The route parts. `lang` is the "gb-en" segment every page is scoped by. */
  params: Record<string, string | string[]>;
  /** The query string, without the leading "?". */
  search: string;
};

export const DEFAULT_ROUTE: TestRoute = {
  pathname: `/${DEFAULT_LANG_SEGMENT}`,
  params: { lang: DEFAULT_LANG_SEGMENT },
  search: "",
};

let route: TestRoute = { ...DEFAULT_ROUTE };

/** What the hooks are answering right now. */
export const getRoute = (): TestRoute => route;

/** Change the route the hooks answer with. Anything you leave out stays as it is. */
export function setRoute(next: Partial<TestRoute>) {
  route = { ...route, ...next };
}

/** Put the route back to the default. tests/setup.ts calls this after each test. */
export function resetRoute() {
  route = { ...DEFAULT_ROUTE };
  Object.values(routerSpies).forEach((spy) => spy.mockClear());
  navigationSpies.redirect.mockClear();
  navigationSpies.permanentRedirect.mockClear();
  navigationSpies.notFound.mockClear();
}

/** Everything `useRouter()` offers, so a test can check where it was sent. */
export const routerSpies = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

/** The three that leave the page. They record the call and then throw (see below). */
export const navigationSpies = {
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
};

/**
 * Build the stand-in module.
 *
 * `redirect`, `permanentRedirect` and `notFound` throw, exactly as the real ones
 * do — they are meant to stop the render where they are called, and a stand-in
 * that quietly carried on would run code that never runs in the live app. To
 * check one was called, read `navigationSpies` after catching the error.
 */
export function makeNavigationMock() {
  const useRouter = () => routerSpies;
  const usePathname = () => route.pathname;
  const useParams = () => route.params;
  const useSearchParams = () => new URLSearchParams(route.search);

  const leave = (name: keyof typeof navigationSpies) => (...args: any[]) => {
    navigationSpies[name](...args);
    throw new Error(
      `${name}() was called with ${JSON.stringify(args)}. ` +
        `This is the stand-in in tests/mocks/nextNavigation.ts: it throws because ` +
        `the real one does. Read navigationSpies.${name} to check the call.`,
    );
  };

  return {
    useRouter,
    usePathname,
    useParams,
    useSearchParams,
    redirect: leave("redirect"),
    permanentRedirect: leave("permanentRedirect"),
    notFound: leave("notFound"),
    // Segment helpers: nothing in components/ reads them today, but a component
    // that starts to should not crash on a missing export.
    useSelectedLayoutSegment: () => null,
    useSelectedLayoutSegments: () => [],
    ReadonlyURLSearchParams: URLSearchParams,
    // Next re-throws its own control-flow errors through this. Nothing here
    // throws one, so passing the error straight on is the whole job.
    unstable_rethrow: (error: unknown) => {
      throw error;
    },
  };
}
