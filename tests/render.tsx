// The one way to put a component on the page in a test.
//
// Every component phase uses this instead of calling `render()` directly, so no
// phase has to work out for itself how this app's store, locale and route fit
// together. It does four things:
//
//   1. Seeds the shared store, starting from a clean slate every time.
//   2. Puts the browser on the right address — this app keeps the locale in the
//      first path segment ("/gb-ar/…"), and a lot of code reads it from there.
//   3. Waits for the language file to be in memory, so translated copy is on the
//      page at the first render instead of one tick later.
//   4. Wraps the component in the two contexts the real layout provides.
//
// WHAT IT DELIBERATELY DOES NOT DO
// It never mounts `<Page variant="scaled">`. AppScaler uses fixed element ids
// and `:root` variables and does not count how many copies are up, so a second
// one breaks the first. A test that needs the scaled canvas mounts it itself,
// once.
//
//   const { store } = await renderWithProviders(<CartBadge />, {
//     store: { user: buildUser() },
//     language: "ar",
//     path: "/cart",
//   });
//
//   expect(screen.getByText("السلة")).toBeInTheDocument();
import { render, waitFor, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { ModalRouteContext } from "components/ModalRoute/ModalRouteContext";
import { OverlayVisibilityProvider } from "components/ModalRoute/OverlayVisibility";
import { useAppStore } from "store";

import { setRoute } from "./mocks/nextNavigation";

/** The four languages the app ships. English is the source, so it has no file. */
export type Language = "en" | "ar" | "tr" | "ku";

export type RenderWithProvidersOptions = {
  /** State to start the store with. Anything you leave out keeps its own default. */
  store?: Record<string, any>;
  /** Which language to render in. Default "en". */
  language?: Language;
  /** Which country the locale segment names. Default "gb". */
  country?: string;
  /** The path after the locale segment. Default "/". */
  path?: string;
  /** The query string. "?color=red" and "color=red" both work. */
  search?: string;
  /** Extra route parts, on top of the `lang` segment this helper sets for you. */
  params?: Record<string, string | string[]>;
  /** Render as though the component is inside an intercepted-route overlay. */
  isModalRoute?: boolean;
  /** Passed straight through to Testing Library. */
  renderOptions?: Omit<RenderOptions, "wrapper">;
};

/** Load a language file the same way the app does, so we read the same object. */
async function loadDictionary(
  language: Language,
): Promise<Record<string, string>> {
  if (language === "ar")
    return (await import("public/translations/translations.ar.js")).default;
  if (language === "tr")
    return (await import("public/translations/translations.tr.js")).default;
  if (language === "ku")
    return (await import("public/translations/translations.ku.js")).default;
  return {};
}

/**
 * Make sure translated copy is ready before the first render.
 *
 * `translateFunction` is not async, but the language file it needs is. On a cold
 * cache it hands back the English key, starts the load, and only translates from
 * the next call on. A test that rendered straight away would see English and
 * fail for a reason that has nothing to do with the component.
 *
 * The cache lives inside utils/functions.tsx and is not exported, so the only
 * honest way to know it is warm is to ask it: call `translateFunction` with a
 * key we know is in the file and wait for the answer to change.
 */
async function warmTranslations(language: Language) {
  if (language === "en") return;

  const dictionary = await loadDictionary(language);
  const probeKey = Object.keys(dictionary).find(
    (key) => dictionary[key] && dictionary[key] !== key,
  );
  if (!probeKey) return;

  // Imported here, not at the top of the file, so an English-only test never
  // pays for utils/functions.tsx and everything behind it.
  const { translateFunction } = await import("utils/functions");

  translateFunction(probeKey);
  await waitFor(() => {
    if (translateFunction(probeKey) === probeKey) {
      throw new Error(`The ${language} file is still loading.`);
    }
  });
}

/** The contexts the real layout puts around every page. */
function Providers({
  children,
  isModalRoute,
}: {
  children: ReactNode;
  isModalRoute: boolean;
}) {
  return (
    <ModalRouteContext.Provider value={isModalRoute}>
      <OverlayVisibilityProvider>{children}</OverlayVisibilityProvider>
    </ModalRouteContext.Provider>
  );
}

/**
 * Render a component with a seeded store, a resolved locale and a route.
 *
 * Always await it: the language file has to be in memory before the first
 * render, and that is asynchronous.
 */
export async function renderWithProviders(
  ui: ReactElement,
  {
    store = {},
    language = "en",
    country = "gb",
    path = "/",
    search = "",
    params = {},
    isModalRoute = false,
    renderOptions,
  }: RenderWithProvidersOptions = {},
) {
  const langSegment = `${country}-${language}`;
  const query = search.replace(/^\?/, "");
  const pathname = `/${langSegment}${path === "/" ? "" : path}`;

  // 1. The address. jsdom has a real history, so the app's own code can read the
  //    locale out of window.location exactly as it does in a browser.
  window.history.pushState({}, "", `${pathname}${query ? `?${query}` : ""}`);

  // 2. The route the App Router hooks answer with — see tests/mocks/nextNavigation.ts.
  setRoute({
    pathname,
    search: query,
    params: { lang: langSegment, ...params },
  });

  // 3. The store. Starting from its own initial state means a test never
  //    inherits what the test before it left behind, whether the real store is
  //    in use or the stand-in from tests/mocks/store.ts.
  const initialState = useAppStore.getInitialState();
  useAppStore.setState(
    { ...initialState, language, country, ...store } as any,
    true as any,
  );

  // 4. The language file, before anything renders.
  await warmTranslations(language);

  const result = render(ui, {
    wrapper: ({ children }) => (
      <Providers isModalRoute={isModalRoute}>{children}</Providers>
    ),
    ...renderOptions,
  });

  return {
    ...result,
    /** The store the component is reading, for seeding more or checking after. */
    store: useAppStore,
    /** The locale segment that went into the path, e.g. "gb-ar". */
    langSegment,
  };
}

// Re-exported so a test file has one place to import from.
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
