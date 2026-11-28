// The real sign-in request (components/DemoApp1/AppSignInAsk.tsx and its lazy
// layer SignInAskLayer.tsx, Stage 7e part 2): the /demo sheet on every page but
// the login, /loginDemo and /demo, for a guest only, SIGN_IN_ASK_MS after the
// page shows, once per page load.
//
// The sheet and the login widget are stand-ins here; their own files have
// their own tests. The timer, the guest rule, the waits and the login layer
// are the real ones.
import React from "react";
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";
import { routerSpies } from "../../mocks/nextNavigation";

// The sheet and the login load lazily; this runs the same loaders in a Suspense.
vi.mock("next/dynamic", async () => {
  const { Suspense, lazy } = await import("react");
  return {
    default: (loader: () => Promise<any>, options: any) => {
      const Lazy = lazy(loader);
      return (props: any) => (
        <Suspense fallback={options?.loading?.() ?? null}>
          <Lazy {...props} />
        </Suspense>
      );
    },
  };
});
vi.mock("components/skeleton/SheetSkeleton", () => ({ default: () => null }));
vi.mock("components/DemoApp1/screens/SignInRequestSheet", () => ({
  default: (p: any) =>
    p.open ? (
      <div data-testid="sheet">
        <button onClick={p.onStart}>start</button>
        <button onClick={p.onClose}>later</button>
        <button onClick={p.onMoreInfo}>more</button>
      </div>
    ) : null,
}));
vi.mock("NewLoginDesign/NewLoginWidget", async () => {
  const { useEffect } = await import("react");
  function LoginStandIn(p: any) {
    // As the login's page scaler (scaling/AppScaler.tsx) does: it clears
    // <body>'s colour when it unmounts, after the host's own close handler.
    useEffect(
      () => () => {
        document.body.style.removeProperty("background-color");
      },
      [],
    );
    return (
      <div data-testid="login" data-step={p.initialStep}>
        <button onClick={p.onFinish}>done</button>
      </div>
    );
  }
  return { default: LoginStandIn };
});

import AppSignInAsk, { SIGN_IN_ASK_MS, resetSignInAsk } from "components/DemoApp1/AppSignInAsk";
import { addLayerLock, removeLayerLock } from "components/DemoApp1/layerLocks";
import { useAppStore } from "store";

const GUEST = { id: 41, phone: "0" };
const SHOPPER = { id: 7, phone: "963912345678" };
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const agent =
  Object.getOwnPropertyDescriptor(navigator, "userAgent") ??
  Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");

/** Moves the clock on, and lets the lazy parts resolve. */
const wait = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const open = (path = "/", store: Record<string, any> = { userProfile: GUEST }) =>
  renderWithProviders(<AppSignInAsk words={{ "Soon available": "Soon available" }} />, {
    country: "sy",
    path,
    store,
  });

const sheet = () => screen.queryByTestId("sheet");

describe("AppSignInAsk — the real sign-in request", () => {
  // The layer (sheet, toast, login) is a lazy part. Load its module once, with
  // the real clock, so under the fake clock it resolves as a loaded chunk does.
  beforeAll(async () => {
    await import("components/DemoApp1/SignInAskLayer");
  });
  beforeEach(() => {
    resetSignInAsk();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    if (agent) Object.defineProperty(navigator, "userAgent", agent);
    document.documentElement.style.removeProperty("--xd-unit");
    document.documentElement.style.removeProperty("background-color");
    document.body.style.removeProperty("background-color");
  });

  it("a guest sees the request 5 s after the page shows, once", async () => {
    const view = await open();
    await wait(SIGN_IN_ASK_MS - 200);
    expect(sheet(), "the request came before 5 s").toBeNull();
    await wait(400);
    expect(sheet(), "a guest did not get the request 5 s after the page showed").not.toBeNull();
    fireEvent.click(screen.getByText("later"));
    await wait(0);
    expect(sheet(), "Later did not close the request").toBeNull();
    view.unmount();
    await open("/about");
    await wait(SIGN_IN_ASK_MS * 2);
    expect(sheet(), "the request came twice in one page load").toBeNull();
  });

  it("a signed-in shopper never sees it", async () => {
    await open("/", { userProfile: SHOPPER });
    await wait(15000);
    expect(sheet(), "a signed-in shopper got the sign-in request").toBeNull();
  });

  it("no request before the profile is known", async () => {
    await open("/", { userProfile: null });
    await wait(SIGN_IN_ASK_MS + 3000);
    expect(sheet(), "the request came before the profile was known").toBeNull();
    act(() => useAppStore.setState({ userProfile: GUEST } as any));
    await wait(1000);
    expect(sheet(), "the request did not come within a second of the guest profile").not.toBeNull();
  });

  it("no request on the login page, loginDemo or demo", async () => {
    for (const path of ["/login", "/loginDemo", "/demo"]) {
      resetSignInAsk();
      const view = await open(path);
      await wait(SIGN_IN_ASK_MS + 2000);
      expect(sheet(), `the request came on ${path}`).toBeNull();
      view.unmount();
    }
  });

  it("a request on an old page and on a product page", async () => {
    const view = await open("/about");
    await wait(SIGN_IN_ASK_MS + 100);
    expect(sheet(), "the request did not come on an old page (/about)").not.toBeNull();
    view.unmount();
    resetSignInAsk();
    await open("/products/shirt-1");
    await wait(SIGN_IN_ASK_MS + 100);
    expect(sheet(), "the request did not come on a product page").not.toBeNull();
  });

  it("a crawler gets no sign-in request", async () => {
    Object.defineProperty(navigator, "userAgent", { value: GOOGLEBOT, configurable: true });
    await open();
    await wait(SIGN_IN_ASK_MS + 2000);
    expect(sheet(), "a crawler got the sign-in request").toBeNull();
  });

  it("waits while the search, a chat or a sheet is open and comes up within a second after", async () => {
    await open("/", { userProfile: GUEST, enable_search: true });
    await wait(SIGN_IN_ASK_MS + 2000);
    expect(sheet(), "the request opened over the search").toBeNull();
    act(() => useAppStore.setState({ enable_search: false, chatVar: true } as any));
    await wait(2000);
    expect(sheet(), "the request opened over a chat").toBeNull();
    act(() => useAppStore.setState({ chatVar: false } as any));
    addLayerLock();
    await wait(2000);
    expect(sheet(), "the request opened over another sheet").toBeNull();
    removeLayerLock();
    await wait(1000);
    expect(sheet(), "the request did not come within a second after the last layer closed").not.toBeNull();
  });

  it("waits while a field has focus", async () => {
    const field = document.createElement("input");
    document.body.appendChild(field);
    field.focus();
    await open();
    await wait(SIGN_IN_ASK_MS + 2000);
    expect(sheet(), "the request opened while the shopper was typing").toBeNull();
    field.blur();
    await wait(1000);
    expect(sheet(), "the request did not come within a second after the field lost focus").not.toBeNull();
    field.remove();
  });

  it("waits while the session check is open", async () => {
    await open("/", { userProfile: GUEST, shouldAuthinticated: "expired" });
    await wait(SIGN_IN_ASK_MS + 3000);
    expect(sheet(), "the request opened over the session-expired prompt (a second login canvas)").toBeNull();
    act(() => useAppStore.setState({ shouldAuthinticated: false } as any));
    await wait(1000);
    expect(sheet(), "the request did not come after the session prompt closed").not.toBeNull();
  });

  it("Get Started opens the login layer and its end closes it with no route change and puts the page colour back", async () => {
    await open("/about");
    await wait(SIGN_IN_ASK_MS + 100);
    fireEvent.click(screen.getByText("start"));
    await wait(0);
    expect(sheet(), "the request stayed open under the login").toBeNull();
    expect(screen.getByTestId("login").dataset.step, "Get Started did not open the login at its Get Started step").toBe(
      "get-started",
    );
    expect(useAppStore.getState().loginLayerOpen, "the login layer did not hold the other login canvases").toBe(true);

    // What the login's page scaler leaves behind when it closes.
    document.documentElement.style.setProperty("--xd-unit", "2px");
    document.documentElement.style.setProperty("background-color", "rgb(250, 250, 250)");
    document.body.style.removeProperty("background-color");

    fireEvent.click(screen.getByText("done"));
    await wait(0);
    expect(screen.queryByTestId("login"), "the login's end did not close the layer").toBeNull();
    expect(useAppStore.getState().loginLayerOpen, "the closed login layer still holds the other canvases").toBe(false);
    expect(document.documentElement.style.getPropertyValue("--xd-unit"), "the login's --xd-unit was left on the page").toBe("");
    expect(document.body.style.getPropertyValue("background-color"), "the page's colour was not put back on <body>").toBe(
      "rgb(250, 250, 250)",
    );
    expect(window.location.pathname, "the login's end moved the shopper off the page").toBe("/sy-en/about");
    expect(routerSpies.push, "the login's end changed the route").not.toHaveBeenCalled();
  });

  it("More Info shows Soon available", async () => {
    await open();
    await wait(SIGN_IN_ASK_MS + 100);
    fireEvent.click(screen.getByText("more"));
    await wait(0);
    expect(screen.getByRole("status").textContent, "More Info did not say Soon available").toBe("Soon available");
  });
});
