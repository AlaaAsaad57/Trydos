// The share row on a product: social networks (react-share), e-mail, copy
// link, the browser's own share sheet, and the shopper's chat contacts
// (ShareAvatar). Every network share is counted on the chat backend
// (share_product_on_apps) and reported to analytics.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ShareOptions from "components/products/ShareOptions";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...a: any[]) => fetchData(...a),
  abortInFlightForLogout: vi.fn(),
}));

const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
vi.mock("services/auth", () => ({ default: { UserID: () => 77 } }));

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => logError(...a),
}));

const showSuccessNotification = vi.fn();
vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showSuccessNotification: (...a: any[]) => showSuccessNotification(...a),
}));

const PRODUCT = {
  id: 9,
  name: "Red Shoe",
  offer_price: 20,
  boutique_id: 3,
  brand: { id: 1, name: "B" },
  categories: [{ id: 2, name: "C" }],
};

const sharedApps = () =>
  fetchData.mock.calls.map(([p]: any) => JSON.parse(p.body).app_name);

describe("ShareOptions", () => {
  beforeEach(() => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true });
    GAevent.mockReset();
    logError.mockReset();
    showSuccessNotification.mockReset();
    vi.stubGlobal("open", vi.fn(() => ({})));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-ignore — put navigator.share back to "absent" for the next case.
    delete (navigator as any).share;
  });

  it("counts each network share on the chat backend and reports it", async () => {
    await renderWithProviders(<ShareOptions product={PRODUCT} />, { path: "/p/red-shoe" });
    fireEvent.click(document.querySelector('[data-pw="Facebook"]') as HTMLElement);
    fireEvent.click(document.querySelector('[data-pw="Twitter"] button') as HTMLElement);
    const whatsappLike = document.querySelectorAll('[data-pw="Whatsapp"] button');
    fireEvent.click(whatsappLike[0]);
    fireEvent.click(whatsappLike[1]);
    await waitFor(() =>
      expect(sharedApps(), "not every network share was counted").toEqual([
        "Facebook",
        "Twitter",
        "WhatsApp",
        "Telegram",
      ]),
    );
    const [params] = fetchData.mock.calls[0];
    expect(params.server, "shares are not counted on the chat backend").toBe("chat");
    expect(JSON.parse(params.body), "the share body is wrong").toEqual({
      app_name: "Facebook",
      product_id: 9,
      shared_count: 1,
    });
    await waitFor(() =>
      expect(GAevent, "a counted share was not reported").toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ method_share: "Facebook", item_id: 9, boutique_id: 3 }),
        }),
      ),
    );
    expect(
      String((window.open as any).mock.calls[0][0]),
      "the Facebook link does not carry the utm source",
    ).toContain(encodeURIComponent("utm_source=facebook"));
  });

  it("logs and does not report a share the chat backend refused", async () => {
    fetchData.mockResolvedValue({ success: false });
    await renderWithProviders(<ShareOptions product={PRODUCT} />);
    fireEvent.click(document.querySelector('[data-pw="Facebook"]') as HTMLElement);
    await waitFor(() => expect(logError, "a refused share count was not logged").toHaveBeenCalled());
    expect(GAevent, "a refused share was still reported").not.toHaveBeenCalled();
  });

  it("e-mails through Gmail on a desktop browser", async () => {
    await renderWithProviders(<ShareOptions product={PRODUCT} />);
    const clicked: string[] = [];
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push(this.href);
      });
    fireEvent.click(screen.getByText("Email").previousElementSibling!.querySelector("button")!);
    expect(clicked[0], "desktop e-mail did not open Gmail").toMatch(
      /^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&su=Red%20Shoe&body=Red%20Shoe/,
    );
    click.mockRestore();
    await waitFor(() => expect(sharedApps(), "the e-mail share was not counted").toContain("email"));
  });

  it("e-mails through mailto on a phone, with a default subject for a nameless product", async () => {
    const ua = vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone)");
    const hrefs: string[] = [];
    const location = window.location;
    vi.stubGlobal("location", {
      ...location,
      origin: location.origin,
      pathname: location.pathname,
      search: location.search,
      set href(v: string) {
        hrefs.push(v);
      },
      get href() {
        return location.href;
      },
    });
    await renderWithProviders(<ShareOptions product={{ id: 9 }} />);
    fireEvent.click(screen.getByText("Email").previousElementSibling!.querySelector("button")!);
    expect(hrefs[0], "phone e-mail did not use mailto with the default subject").toMatch(
      /^mailto:\?subject=Check%20this%20out&body=/,
    );
    ua.mockRestore();
  });

  it("copies the page link and says so", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    await renderWithProviders(<ShareOptions product={PRODUCT} />);
    fireEvent.click(document.querySelector('[data-pw="copy_link_button"]') as HTMLElement);
    await waitFor(() =>
      expect(showSuccessNotification, "copying did not confirm").toHaveBeenCalledWith(
        "Link Copied to Clipboard",
      ),
    );
    expect(writeText, "the page link was not copied").toHaveBeenCalledWith(window.location.href);
  });

  it("offers the browser share sheet only where it exists, and counts a finished share", async () => {
    const share = vi.fn(async () => {});
    (navigator as any).share = share;
    await renderWithProviders(<ShareOptions product={PRODUCT} />);
    const native = await waitFor(() => {
      const el = document.querySelector('[data-pw="NativeShare"] > div');
      expect(el, "the native share button is missing where navigator.share exists").toBeTruthy();
      return el as HTMLElement;
    });
    await act(async () => {
      fireEvent.click(native);
    });
    expect(share, "the share sheet did not get the product").toHaveBeenCalledWith(
      expect.objectContaining({ title: "Red Shoe", url: expect.stringContaining("utm_source=native_share") }),
    );
    await waitFor(() => expect(sharedApps(), "the native share was not counted").toContain("native_share"));

    // Dismissing the sheet is not an error; another failure is logged.
    share.mockRejectedValueOnce(Object.assign(new Error("x"), { name: "AbortError" }));
    await act(async () => {
      fireEvent.click(native);
    });
    expect(logError, "a dismissed share sheet was logged").not.toHaveBeenCalled();
    share.mockRejectedValueOnce(new Error("broken"));
    await act(async () => {
      fireEvent.click(native);
    });
    expect(logError, "a failed share sheet was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "Error In nativeShare in ShareOptions" }),
    );
  });

  it("does not offer the share sheet where the browser has none", async () => {
    await renderWithProviders(<ShareOptions product={PRODUCT} />);
    expect(document.querySelector('[data-pw="NativeShare"]'), "a share sheet showed without navigator.share").toBeNull();
  });

  it("lists chat contacts once each, never the shopper, and toggles them", async () => {
    const me = { id: 1 };
    const contacts = [
      { id: 10, contact_user_id: "2", name: "Rana (contact)", contact_user: { photo_path: "/p.jpg" } },
      { id: 11, contact_user_id: null, name: "No account" },
      { id: 12, contact_user_id: "1", name: "Myself" },
    ];
    const data = [
      // The same person as contact 2: the contact list wins.
      { channel_members: [{ user_id: 1 }, { user_id: 2, user: { id: 2, name: "Rana (chat)" } }] },
      // A chat-only person, with no saved contact.
      {
        channel_members: [
          { user_id: 1 },
          { user_id: 3, user: { id: 3, name: "Omar", mobile_phone: "x", photo_path: "https://example.com/o.jpg" } },
        ],
      },
      // A chat person who is a saved contact under another name.
      {
        channel_members: [
          { user_id: 1 },
          { user_id: 4, user: { id: 4, name: "L", contact_user: { id: 40, name: "Layla" } } },
        ],
      },
      // A channel with nobody else in it.
      { channel_members: [{ user_id: 1 }] },
    ];
    const { store } = await renderWithProviders(<ShareOptions product={PRODUCT} />, {
      store: {
        user: { id: 1 },
        userChat: me,
        contacts,
        data,
        selectedContactsForShare: [],
        shareLoading: false,
      },
    });
    expect(screen.getByText("Rana (contact)"), "the saved contact is missing").toBeInTheDocument();
    expect(screen.queryByText("Rana (chat)"), "a person showed twice").not.toBeInTheDocument();
    expect(screen.getByText("Omar"), "the chat-only person is missing").toBeInTheDocument();
    expect(screen.getByText("Layla"), "the contact name of a chat person is not used").toBeInTheDocument();
    expect(screen.queryByText("Myself"), "the shopper was offered to themself").not.toBeInTheDocument();
    expect(screen.queryByText("No account"), "a contact without an account was offered").not.toBeInTheDocument();

    const omar = screen.getByText("Omar").parentElement as HTMLElement;
    fireEvent.click(omar);
    expect(store.getState().selectedContactsForShare, "choosing Omar did not select him").toEqual(["3"]);
    expect(omar.className, "a chosen contact is not marked").toContain("selected");
    fireEvent.click(omar);
    expect(store.getState().selectedContactsForShare, "choosing Omar again did not unselect").toEqual([]);
  });

  it("does not select contacts while a share is being sent", async () => {
    const { store } = await renderWithProviders(<ShareOptions product={PRODUCT} />, {
      store: {
        user: { id: 1 },
        userChat: { id: 1 },
        contacts: [{ id: 10, contact_user_id: "2", contact_user: { name: "Rana" } }],
        data: null,
        selectedContactsForShare: [],
        shareLoading: true,
      },
    });
    const rana = screen.getByText("Rana").parentElement as HTMLElement;
    expect(rana.className, "a busy contact is not dimmed").toContain("opacity-50");
    fireEvent.click(rana);
    expect(store.getState().selectedContactsForShare, "a contact was selected while busy").toEqual([]);
  });
});
