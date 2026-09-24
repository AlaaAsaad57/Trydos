// The menu on a seller's reply to a question: translate it, then show the
// original again.
import { beforeEach, describe, expect, it, vi } from "vitest";

const LogError = vi.fn();

vi.mock("utils/fetchData", async () => {
  const { makeFetchDataMock } = await import("../../../../mocks/fetchData");
  return makeFetchDataMock();
});
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...a: any[]) => LogError(...a),
}));

import { fetchData } from "utils/fetchData";
import BuyersReplyMenu from "components/Server/product/ProductBuyersComment/BuyersReplyMenu";

import {
  fireEvent,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../../render";

const renderMenu = async (props: Record<string, any> = {}) => {
  const setDisplayReply = vi.fn();
  await renderWithProviders(
    <BuyersReplyMenu
      id={5}
      isRtl={false}
      language="en"
      sellerReply="seller words"
      setDisplayReply={setDisplayReply}
      {...props}
    />,
  );
  return { setDisplayReply };
};

const openMenu = () =>
  userEvent.click(screen.getByRole("button", { name: "Reply options menu" }));
const translateButton = () =>
  screen.getByRole("button", { name: /Translate|Show Original/ });

describe("the seller reply menu", () => {
  beforeEach(() => {
    (fetchData as any).mockReset();
    LogError.mockReset();
  });

  it("translates the reply, then shows the original from the backend again", async () => {
    (fetchData as any).mockResolvedValue({
      success: true,
      original_text: "backend original",
      translated_text: "translated reply",
    });
    const { setDisplayReply } = await renderMenu();
    await openMenu();
    await userEvent.click(translateButton());
    await waitFor(() =>
      expect(setDisplayReply, "the translated reply should be shown").toHaveBeenCalledWith(
        "translated reply",
      ),
    );
    expect(
      JSON.parse((fetchData as any).mock.calls[0][0].body),
      "the comments backend should be asked to translate the seller reply",
    ).toEqual({ target_language: "en", translate_type: "seller_reply" });

    await openMenu();
    await userEvent.click(translateButton());
    expect(
      setDisplayReply,
      "Show Original should put the backend's original back",
    ).toHaveBeenLastCalledWith("backend original");
  });

  it("falls back to the reply it was given when the backend sends no original", async () => {
    (fetchData as any).mockResolvedValue({
      success: true,
      translated_text: "translated reply",
    });
    const { setDisplayReply } = await renderMenu({ isRtl: true });
    await openMenu();
    await userEvent.click(translateButton());
    await waitFor(() => expect(setDisplayReply).toHaveBeenCalled());
    await openMenu();
    await userEvent.click(translateButton());
    expect(
      setDisplayReply,
      "without a backend original, the given reply should come back",
    ).toHaveBeenLastCalledWith("seller words");
  });

  it("leaves the reply alone when no translation comes back", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const { setDisplayReply } = await renderMenu({ sellerReply: "" });
    await openMenu();
    await userEvent.click(translateButton());
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Translate/ }),
        "the menu should close",
      ).toBeNull(),
    );
    expect(setDisplayReply, "no translation means no change").not.toHaveBeenCalled();
  });

  it("reports a refused translation", async () => {
    (fetchData as any).mockResolvedValue({ success: false, message: "no" });
    await renderMenu();
    await openMenu();
    await userEvent.click(translateButton());
    await waitFor(() =>
      expect(LogError, "a refused translation should be reported").toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In handleTranslateReply in BuyersReplyMenu",
        }),
      ),
    );
  });

  it("opens with the keyboard and closes on a click outside", async () => {
    await renderMenu();
    const trigger = screen.getByRole("button", { name: "Reply options menu" });
    fireEvent.keyDown(trigger, { key: " " });
    expect(translateButton(), "Space should open the menu").toBeInTheDocument();
    fireEvent.mouseDown(translateButton());
    expect(translateButton(), "a click inside must not close it").toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Translate/ }),
        "a click outside should close the menu",
      ).toBeNull(),
    );
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "x" });
    expect(translateButton(), "Enter should open it and other keys do nothing").toBeInTheDocument();
  });
});
