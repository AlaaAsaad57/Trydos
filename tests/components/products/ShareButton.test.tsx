// The "Share" button under the chat contacts in the share panel. It sends the
// product as a chat message (services/chat) to every contact the shopper
// picked, reports the share, and asks for a contact when none is picked.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShareButton from "components/products/ShareButton";

import { fireEvent, renderWithProviders, screen } from "../../render";

const { chat } = vi.hoisted(() => ({ chat: { ShareProduct: vi.fn() } }));
vi.mock("services/chat", () => ({ default: chat }));
vi.mock("services/auth", () => ({ default: { UserID: () => 7 } }));
const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
const showErrorNotification = vi.fn();
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));
const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => logError(...a),
}));

const PROPS = {
  id: 9,
  slug: "shoe",
  details: "A shoe",
  brand: { id: 1, name: "B" },
  category: { id: 2, name: "C" },
  price: 20,
  name: "Shoe",
  Image: "/shoe.jpg",
  boutique_id: 3,
};

async function renderButton(store: any, brand: any = PROPS.brand) {
  const close = vi.fn();
  const view = await renderWithProviders(<ShareButton {...PROPS} brand={brand} close={close} />, { store });
  return { ...view, close };
}

describe("ShareButton", () => {
  beforeEach(() => {
    chat.ShareProduct.mockReset();
    GAevent.mockReset();
    showErrorNotification.mockReset();
    logError.mockReset();
  });

  it("sends the product to the picked contacts over chat, then clears and closes", async () => {
    const { store, close } = await renderButton({ selectedContactsForShare: ["2", "3"], shareLoading: false });
    fireEvent.click(screen.getByText("Share"));
    expect(store.getState().shareLoading, "the share did not show as busy").toBe(true);
    const [{ userId, product, callback }] = chat.ShareProduct.mock.calls[0];
    expect(userId, "the share did not go to the picked contacts").toEqual(["2", "3"]);
    expect(product, "the shared product message is wrong").toEqual({
      product_id: 9,
      product_image_url: "/shoe.jpg",
      product_name: "Shoe",
      product_slug: "shoe",
      product_description: "A shoe",
    });
    expect(GAevent, "the internal share was not reported").toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ share_context: "internal", item_id: 9 }) }),
    );
    callback();
    expect(store.getState().shareLoading, "the busy state stayed after sending").toBe(false);
    expect(store.getState().selectedContactsForShare, "the picked contacts were not cleared").toEqual([]);
    expect(close, "the panel was not closed").toHaveBeenCalled();
  });

  it("asks for a contact when none is picked", async () => {
    await renderButton({ selectedContactsForShare: [], shareLoading: false });
    fireEvent.click(screen.getByText("Share"));
    expect(showErrorNotification, "no contact did not ask for one").toHaveBeenCalledWith(
      "please select one contact at least",
    );
    expect(chat.ShareProduct, "a share was sent to nobody").not.toHaveBeenCalled();
  });

  it("does nothing while a share is going out", async () => {
    await renderButton({ selectedContactsForShare: ["2"], shareLoading: true });
    fireEvent.click(screen.getByText("Share"));
    expect(chat.ShareProduct, "a second share was sent while busy").not.toHaveBeenCalled();
  });

  it("logs and clears the busy state when building the report fails", async () => {
    const { store } = await renderButton({ selectedContactsForShare: ["2"], shareLoading: false }, null);
    fireEvent.click(screen.getByText("Share"));
    expect(logError, "the failure was not logged").toHaveBeenCalled();
    expect(store.getState().shareLoading, "the busy state stayed after the failure").toBe(false);
  });
});
