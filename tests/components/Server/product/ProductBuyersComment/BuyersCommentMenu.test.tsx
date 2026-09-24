// The three-dot menu on a comment or FAQ question: translate / show original
// for everyone, and edit / delete for the comment's owner.
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
import BuyersCommentMenu from "components/Server/product/ProductBuyersComment/BuyersCommentMenu";

import {
  fireEvent,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../../render";

const comment = { id: 11, comment: "original words", has_reply: false };

const renderMenu = async (
  props: Record<string, any> = {},
  store: Record<string, any> = {},
) => {
  const setDisplayText = vi.fn();
  const setBuyerCommentModalOption = vi.fn();
  await renderWithProviders(
    <BuyersCommentMenu
      id={11}
      ownerID={3}
      ownerType="user"
      isRtl={false}
      language="en"
      isOwner={false}
      comment={comment}
      comment_type="review"
      setDisplayText={setDisplayText}
      {...props}
    />,
    {
      store: {
        BuyerCommentModalOption: false,
        setBuyerCommentModalOption,
        ...store,
      },
    },
  );
  return { setDisplayText, setBuyerCommentModalOption };
};

const openMenu = () =>
  userEvent.click(screen.getByRole("button", { name: "Comment options menu" }));

describe("the comment menu", () => {
  beforeEach(() => {
    (fetchData as any).mockReset();
    LogError.mockReset();
  });

  it("translates the comment, then shows the original again", async () => {
    (fetchData as any).mockResolvedValue({
      success: true,
      original_text: "original words",
      translated_text: "translated words",
    });
    const { setDisplayText } = await renderMenu();
    await openMenu();
    await userEvent.click(screen.getByText("Translate"));
    await waitFor(() =>
      expect(
        setDisplayText,
        "the translated text should replace the comment text",
      ).toHaveBeenCalledWith("translated words"),
    );
    expect(
      (fetchData as any).mock.calls[0][0],
      "the translation must be asked of the comments backend, in the reader's language",
    ).toEqual(
      expect.objectContaining({ method: "POST", server: "comments" }),
    );
    expect(
      JSON.parse((fetchData as any).mock.calls[0][0].body).target_language,
      "the reader's language should be sent",
    ).toBe("en");
    expect(
      screen.queryByText("Translate"),
      "the menu should close after translating",
    ).toBeNull();

    await openMenu();
    await userEvent.click(screen.getByText("Show Original"));
    expect(
      setDisplayText,
      "Show Original should put the source text back",
    ).toHaveBeenLastCalledWith("original words");
  });

  it("keeps the text when the answer has no translation", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const { setDisplayText } = await renderMenu({ isRtl: true });
    await openMenu();
    await userEvent.click(screen.getByText("Translate"));
    await waitFor(() =>
      expect(
        screen.queryByText("Translate"),
        "the menu should close",
      ).toBeNull(),
    );
    expect(
      setDisplayText,
      "no translated text means the text must not change",
    ).not.toHaveBeenCalled();
  });

  it("reports a refused translation and keeps the menu open", async () => {
    (fetchData as any).mockResolvedValue({ success: false, message: "no" });
    await renderMenu();
    await openMenu();
    await userEvent.click(screen.getByText("Translate"));
    await waitFor(() =>
      expect(LogError, "a refused translation should be reported").toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In handleTranslateComment in BuyersCommentMenu",
        }),
      ),
    );
    expect(
      screen.getByText("Translate"),
      "the menu should stay open so the shopper can try again",
    ).toBeInTheDocument();
  });

  it("shows a spinner while translating", async () => {
    (fetchData as any).mockReturnValue(new Promise(() => {}));
    await renderMenu();
    await openMenu();
    await userEvent.click(screen.getByText("Translate"));
    expect(
      document
        .querySelector('[data-pw="comment-translate"]')
        ?.hasAttribute("disabled"),
      "the translate button should be disabled while it works",
    ).toBe(true);
  });

  it("offers edit and delete to the owner of a comment with no reply", async () => {
    const { setBuyerCommentModalOption } = await renderMenu({ isOwner: true });
    await openMenu();
    await userEvent.click(screen.getByText("Edit"));
    expect(
      setBuyerCommentModalOption,
      "Edit should open the update modal for this comment",
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        option: "Update",
        id: 11,
        ownerID: 3,
        comment_type: "review",
      }),
    );
    await openMenu();
    await userEvent.click(screen.getByText("Delete"));
    expect(
      setBuyerCommentModalOption,
      "Delete should open the delete modal for this comment",
    ).toHaveBeenLastCalledWith(expect.objectContaining({ option: "Delete" }));
  });

  it("hides edit once the comment has a reply, and hides both from other shoppers", async () => {
    await renderMenu({ isOwner: true, comment: { ...comment, has_reply: true } });
    await openMenu();
    expect(
      screen.queryByText("Edit"),
      "a replied comment must not be editable",
    ).toBeNull();
    expect(
      screen.getByText("Delete"),
      "the owner can still delete it",
    ).toBeInTheDocument();
  });

  it("opens with the keyboard and closes on a click outside", async () => {
    await renderMenu({ fromComments: true });
    const trigger = document.querySelector(
      '[data-pw="comment-options"]',
    ) as HTMLElement;
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByText("Translate"), "Enter should open the menu").toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("Translate"));
    expect(
      screen.getByText("Translate"),
      "a click inside the menu must not close it",
    ).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() =>
      expect(
        screen.queryByText("Translate"),
        "a click outside should close the menu",
      ).toBeNull(),
    );
    fireEvent.keyDown(trigger, { key: " " });
    expect(screen.getByText("Translate"), "Space should open the menu").toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "a" });
    expect(screen.getByText("Translate"), "other keys should do nothing").toBeInTheDocument();
  });

  it("hides the menu button while a comment modal is open", async () => {
    await renderMenu({}, { BuyerCommentModalOption: { option: "Update" } });
    expect(
      screen.queryByRole("button", { name: "Comment options menu" }),
      "no menu button while a modal is open",
    ).toBeNull();
  });
});
