// The "Buyers Comment" sheet on a product. It reads pages of reviews from the
// app's own route (/api/products/comments/buyers_comments), filters them by a
// key, pages with an offset, and lets the author edit or delete a review
// through RatingCommentOptions.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BuyersCommentModal from "components/products/BuyersCommentModal";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { UserID } = vi.hoisted(() => ({ UserID: vi.fn() }));
vi.mock("services/auth", () => ({ default: { UserID } }));

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => logError(...a),
}));

vi.mock("components/global/BottomSheet", () => ({
  default: ({ children, onClose }: any) => (
    <div data-testid="sheet">
      <button onClick={onClose}>close sheet</button>
      {children}
    </div>
  ),
}));
vi.mock("components/Server/product/ProductBuyersComment/BuyerCommentItem", () => ({
  BuyersCommentItem: ({ comment }: any) => <div data-testid="comment">{comment.text}</div>,
}));
vi.mock("components/Server/product/ProductBuyersComment/RatingCommentOptions", () => ({
  RatingCommentOptions: ({ deleteAction, updateAction, handleCloseModal, is_update, is_delete }: any) => (
    <div data-testid="options" data-update={String(is_update)} data-delete={String(is_delete)}>
      <button onClick={() => deleteAction(1)}>delete 1</button>
      <button onClick={() => updateAction({ id: 2 })}>edit 2</button>
      <button onClick={handleCloseModal}>close options</button>
    </div>
  ),
}));

const fetchMock = vi.fn();
const page = (comments: any[], offset: any = null) => ({
  json: async () => ({ data: { buyers_comments: comments, offset } }),
});
const urls = () => fetchMock.mock.calls.map(([u]: any) => new URL(u, "http://x").searchParams);

async function openSheet(store: any = {}, props: any = {}) {
  const deleteComment = vi.fn();
  const editComment = vi.fn();
  const view = await renderWithProviders(
    <BuyersCommentModal
      filters_key={["Size", "Quality"]}
      productId={42}
      deleteComment={deleteComment}
      editComment={editComment}
      {...props}
    />,
    { store: { ColorBottomSheet: { is_buyers_comments: true }, ...store } },
  );
  return { ...view, deleteComment, editComment };
}

describe("BuyersCommentModal", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    logError.mockReset();
    UserID.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the first page for the product and the signed-in user, then pages with the offset", async () => {
    UserID.mockReturnValue(7);
    fetchMock
      .mockResolvedValueOnce(page([{ id: 1, text: "Great" }], { after: [5] }))
      .mockResolvedValueOnce(page([{ id: 2, text: "Fine" }]));
    await openSheet({ language: "ar" });
    await screen.findByText("Great");
    const first = urls()[0];
    expect(first.get("product_id"), "the product was not asked for").toBe("42");
    expect(first.get("user_id"), "the signed-in user was not sent").toBe("7");
    expect(first.get("filter"), "the first page carried a filter").toBeNull();
    expect(fetchMock.mock.calls[0][1].headers.language, "the language header is wrong").toBe("ar");

    fireEvent.click(screen.getByText("Load More"));
    await screen.findByText("Fine");
    expect(
      decodeURIComponent(urls()[1].get("offset")!),
      "the next page did not send the offset",
    ).toBe(JSON.stringify({ after: [5] }));
    expect(screen.getByText("Great"), "paging dropped the first page").toBeInTheDocument();
    expect(screen.queryByText("Load More"), "Load More showed on the last page").not.toBeInTheDocument();
  });

  it("filters by a key, and a second click on the same key removes the filter", async () => {
    UserID.mockReturnValue(null);
    fetchMock.mockResolvedValue(page([]));
    await openSheet();
    await waitFor(() => expect(fetchMock, "the first page was not loaded").toHaveBeenCalledTimes(1));
    expect(urls()[0].get("user_id"), "a guest sent a user id").toBeNull();
    expect(screen.getByText("There is No Comments Yet.."), "an empty list has no message").toBeInTheDocument();

    fireEvent.click(screen.getByText("Size"));
    await waitFor(() => expect(fetchMock, "the filter did not reload").toHaveBeenCalledTimes(2));
    expect(urls()[1].get("filter"), "the filter was not sent").toBe("Size");
    await waitFor(() =>
      expect(screen.getByText("Size").className, "the active filter is not marked").toContain("bg-[#bdd3ff]"),
    );

    fireEvent.click(screen.getByText("Size"));
    await waitFor(() => expect(fetchMock, "unselecting did not reload").toHaveBeenCalledTimes(3));
    expect(urls()[2].get("filter"), "unselecting still sent the filter").toBeNull();
  });

  it("ignores a filter click while a page is loading", async () => {
    let finish: (v: any) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((r) => (finish = r)));
    await openSheet();
    fireEvent.click(screen.getByText("Quality"));
    expect(fetchMock, "a filter click during loading started a second load").toHaveBeenCalledTimes(1);
    await act(async () => finish(page([])));
  });

  it("logs a page that could not be read", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await openSheet();
    await waitFor(() => expect(logError, "a failed page was not logged").toHaveBeenCalled());
  });

  it("clears the list when the sheet closes, and closes through the store", async () => {
    fetchMock.mockResolvedValue(page([{ id: 1, text: "Great" }]));
    const { store } = await openSheet();
    await screen.findByText("Great");
    fireEvent.click(screen.getByText("close sheet"));
    expect(store.getState().ColorBottomSheet, "closing did not clear the sheet state").toBe(false);
    expect(screen.queryByText("Great"), "the list stayed after closing").not.toBeInTheDocument();
  });

  it("removes a deleted review and replaces an edited one", async () => {
    fetchMock.mockResolvedValue(
      page([
        { id: 1, text: "Great" },
        { id: 2, text: "Old text" },
      ]),
    );
    const { deleteComment, editComment, store } = await openSheet({
      BuyerCommentModalOption: { comment_type: "review", option: "Update", id: 2 },
    });
    await screen.findByText("Old text");
    expect(screen.getByTestId("options").dataset.update, "the update option was not passed").toBe("true");

    editComment.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByText("edit 2"));
    await waitFor(() => expect(editComment, "the edit was not sent").toHaveBeenCalledWith({ id: 2 }));
    expect(screen.getByText("Old text"), "a failed edit changed the list").toBeInTheDocument();

    editComment.mockResolvedValueOnce({ id: 2, comment: { id: 2, text: "New text" } });
    fireEvent.click(screen.getByText("edit 2"));
    await screen.findByText("New text");

    deleteComment.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByText("delete 1"));
    await waitFor(() => expect(deleteComment, "the delete was not sent").toHaveBeenCalledWith(1));
    expect(screen.getByText("Great"), "a failed delete removed the review").toBeInTheDocument();

    deleteComment.mockResolvedValueOnce(1);
    fireEvent.click(screen.getByText("delete 1"));
    await waitFor(() => expect(screen.queryByText("Great"), "the deleted review stayed").not.toBeInTheDocument());

    fireEvent.click(screen.getByText("close options"));
    expect(store.getState().BuyerCommentModalOption, "closing the options did not clear them").toBeNull();
  });

  it("shows no options for a comment that is not a review", async () => {
    fetchMock.mockResolvedValue(page([]));
    await openSheet({ BuyerCommentModalOption: { comment_type: "question", option: "Delete" } });
    expect(screen.queryByTestId("options"), "options showed for a question").not.toBeInTheDocument();
  });

  it("renders nothing while the sheet is closed", async () => {
    await openSheet({ ColorBottomSheet: false });
    expect(screen.queryByTestId("sheet"), "the sheet showed while closed").not.toBeInTheDocument();
    expect(fetchMock, "a closed sheet loaded comments").not.toHaveBeenCalled();
  });
});
