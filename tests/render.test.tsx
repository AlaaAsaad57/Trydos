// Proves what tests/render.tsx promises the six component phases, so none of
// them has to find out the hard way. The three checks the roadmap asks for come
// first: seeded state on the page, translated copy for a chosen language, and no
// network call from the helper itself.
import { describe, expect, it } from "vitest";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import EmptyCart from "components/Cart/EmptyCart";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";

import { buildUser } from "./fixtures/user";
import { server } from "./msw/server";
import { act, renderWithProviders, screen, userEvent } from "./render";

function UserBadge() {
  const user = useAppStore((state: any) => state.user);

  return <p data-testid="badge">{user ? user.name : "Guest"}</p>;
}

function Translated({ text }: { text: string }) {
  return <p data-testid="copy">{translateFunction(text)}</p>;
}

function RouteReadout() {
  const params = useParams();
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();

  return (
    <div>
      <p data-testid="lang">{String(params.lang)}</p>
      <p data-testid="slug">{String(params.slug ?? "")}</p>
      <p data-testid="pathname">{pathname}</p>
      <p data-testid="color">{search.get("color") ?? ""}</p>
      <button onClick={() => router.push("/gb-en/cart")}>Go to cart</button>
    </div>
  );
}

describe("renderWithProviders", () => {
  it("puts seeded store state on the page", async () => {
    await renderWithProviders(<UserBadge />, {
      store: { user: buildUser({ name: "Sara" }) },
    });

    expect(screen.getByTestId("badge")).toHaveTextContent("Sara");
  });

  it("starts from a clean store, so the last test does not leak in", async () => {
    await renderWithProviders(<UserBadge />);

    expect(screen.getByTestId("badge")).toHaveTextContent("Guest");
  });

  it("renders translated copy for the chosen language", async () => {
    const dictionary = (
      await import("public/translations/translations.ar.js")
    ).default as Record<string, string>;
    const [key, arabic] = Object.entries(dictionary).find(
      ([source, translated]) => translated && translated !== source,
    )!;

    await renderWithProviders(<Translated text={key} />, { language: "ar" });

    expect(screen.getByTestId("copy")).toHaveTextContent(arabic);
  });

  it("leaves English copy alone", async () => {
    await renderWithProviders(<Translated text="Checkout" />);

    expect(screen.getByTestId("copy")).toHaveTextContent("Checkout");
  });

  it("makes no network call of its own", async () => {
    const asked: string[] = [];
    server.events.on("request:start", ({ request }) => asked.push(request.url));

    await renderWithProviders(<UserBadge />, { language: "ar" });

    expect(asked).toEqual([]);
    server.events.removeAllListeners();
  });

  it("answers the route hooks with the locale it was given", async () => {
    await renderWithProviders(<RouteReadout />, {
      language: "ar",
      country: "tr",
      path: "/products/shoe",
      search: "?color=red",
      params: { slug: "shoe" },
    });

    expect(screen.getByTestId("lang")).toHaveTextContent("tr-ar");
    expect(screen.getByTestId("pathname")).toHaveTextContent(
      "/tr-ar/products/shoe",
    );
    expect(screen.getByTestId("slug")).toHaveTextContent("shoe");
    expect(screen.getByTestId("color")).toHaveTextContent("red");
  });

  it("puts the browser on the same address the hooks report", async () => {
    await renderWithProviders(<RouteReadout />, {
      language: "ku",
      path: "/cart",
    });

    // utils/functions.tsx reads the language straight out of window.location,
    // not from the hooks, so the two have to agree.
    expect(window.location.pathname).toBe("/gb-ku/cart");
  });

  it("goes back to the default route between tests", async () => {
    await renderWithProviders(<RouteReadout />);

    expect(screen.getByTestId("lang")).toHaveTextContent("gb-en");
    expect(screen.getByTestId("pathname")).toHaveTextContent("/gb-en");
  });

  it("records where a component sent the user", async () => {
    const { routerSpies } = await import("./mocks/nextNavigation");
    const user = userEvent.setup();
    await renderWithProviders(<RouteReadout />);

    await user.click(screen.getByRole("button", { name: "Go to cart" }));

    expect(routerSpies.push).toHaveBeenCalledWith("/gb-en/cart");
  });

  it("gives components the real store, not a flat copy of its state", async () => {
    await renderWithProviders(<UserBadge />);

    // The real reducers are there, so a component can call an action and a test
    // does not have to hand one over for every component it renders.
    expect(typeof (useAppStore.getState() as any).setCartPreview).toBe(
      "function",
    );
  });

  it("re-renders a component when the store changes under it", async () => {
    await renderWithProviders(<UserBadge />);
    expect(screen.getByTestId("badge")).toHaveTextContent("Guest");

    act(() => {
      useAppStore.setState({ user: buildUser({ name: "Ali" }) } as any);
    });

    expect(screen.getByTestId("badge")).toHaveTextContent("Ali");
  });
});

describe("a real component through the helper", () => {
  // One component out of the app itself, as a smoke check. Everything above
  // renders components written for the test; this proves the helper works on the
  // real thing, which is what the six component phases will hand it.
  it("renders EmptyCart in English", async () => {
    await renderWithProviders(<EmptyCart />);

    expect(screen.getByText("Cart is Empty")).toBeInTheDocument();
  });

  it("renders EmptyCart in Arabic", async () => {
    const dictionary = (
      await import("public/translations/translations.ar.js")
    ).default as Record<string, string>;

    await renderWithProviders(<EmptyCart />, { language: "ar" });

    expect(screen.getByText(dictionary["Cart is Empty"])).toBeInTheDocument();
  });
});
