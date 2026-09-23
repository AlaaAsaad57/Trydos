// The row of buyers comments on a product page: load more, edit, delete, and
// a full refresh when another widget says the comments changed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LogError = vi.fn();
const optionsProps = vi.fn();

vi.mock("utils/fetchData", async () => {
  const { makeFetchDataMock } = await import("../../../../mocks/fetchData");
  return makeFetchDataMock();
});
vi.mock("services/auth", async () => {
  const { makeMockAuthModule } = await import("../../../../mocks/auth");
  return makeMockAuthModule();
});
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...a: any[]) => LogError(...a),
}));
vi.mock("components/products/BuyersCommentModal", () => ({
  default: ({ editComment, deleteComment }: any) => (
    <div>
      <button
        onClick={() =>
          editComment({
            id: 1,
            comment: "edited",
            star_rating: 5,
            ownerID: 2,
            ownerType: "user",
          })
        }
      >
        modal edit
      </button>
      <button onClick={() => deleteComment(1)}>modal delete</button>
    </div>
  ),
}));
vi.mock("components/Server/product/ProductBuyersComment/BuyerCommentItem", () => ({
  BuyersCommentItem: ({ comment }: any) => (
    <div data-pw="comment">{comment.comment}</div>
  ),
}));
vi.mock("components/Server/product/ProductBuyersComment/BuyerCommentRateInfo", () => ({
  BuyersRatingBar: () => null,
}));
vi.mock("components/Server/product/ProductBuyersComment/RatingCommentOptions", () => ({
  RatingCommentOptions: (p: any) => {
    optionsProps(p);
    return (
      <div>
        <button onClick={() => p.updateAction({ id: 1, comment: "via options", star_rating: 4 })}>
          options update
        </button>
        <button onClick={() => p.deleteAction(1)}>options delete</button>
        <button onClick={() => p.handleCloseModal()}>options close</button>
      </div>
    );
  },
}));

import auth from "services/auth";
import { fetchData } from "utils/fetchData";
import ProductBuyersCommentList from "components/Server/product/ProductBuyersComment/ProductBuyersCommentList";

import { renderWithProviders, screen, userEvent, waitFor } from "../../../../render";

const five = (from = 1) =>
  Array.from({ length: 5 }, (_, i) => ({ id: from + i, comment: `c${from + i}` }));

const fetchMock = vi.fn();
const answer = (data: any) => ({ json: async () => ({ data }) });

const storeSpies = () => ({
  BuyerCommentModalOption: null,
  setBuyerCommentModalOption: vi.fn(),
  ColorBottomSheet: false,
  shouldUpdateComment: null,
  setShouldUpdateComment: vi.fn(),
  patchCommentEntity: vi.fn(),
  removeCommentEntity: vi.fn(),
  commentEntities: {},
  deletedCommentIds: {},
});

const renderList = async (props: Record<string, any> = {}, store: Record<string, any> = {}) => {
  const spies = { ...storeSpies(), ...store };
  await renderWithProviders(
    <ProductBuyersCommentList
      comments={five()}
      offset={[5]}
      loadMoreString="Load More"
      language="en"
      productId={9}
      recommendation_stats={[]}
      filterKeys={[]}
      {...props}
    />,
    { store: spies },
  );
  return spies;
};

const texts = () =>
  Array.from(document.querySelectorAll('[data-pw="comment"]')).map((n) => n.textContent);

describe("the buyers comments row", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    (fetchData as any).mockReset();
    LogError.mockReset();
    optionsProps.mockClear();
    (auth.UserID as any).mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("loads the next page for the signed-in shopper and hides Load More at the end", async () => {
    (auth.UserID as any).mockReturnValue(4);
    fetchMock.mockResolvedValueOnce(answer({ buyers_comments: [{ id: 6, comment: "c6" }], offset: null }));
    await renderList();
    await userEvent.click(screen.getByText("Load More"));
    await waitFor(() => expect(texts(), "the next comment should be added").toContain("c6"));
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url, "the next page must be asked for this product").toContain("product_id=9");
    expect(url, "the signed-in shopper's id should be sent").toContain("user_id=4");
    expect(url, "the page marker should be sent").toContain("offset=");
    expect(screen.queryByText("Load More"), "no page marker back means the end").toBeNull();
  });

  it("keeps Load More while pages keep coming, for a guest", async () => {
    (auth.UserID as any).mockReturnValue(null);
    fetchMock.mockResolvedValueOnce(answer({ buyers_comments: five(6), offset: [10] }));
    await renderList({ language: undefined });
    await userEvent.click(screen.getByText("Load More"));
    await waitFor(() => expect(texts(), "the next page should be added").toContain("c10"));
    expect(fetchMock.mock.calls[0][0], "a guest sends no user id").not.toContain("user_id");
    expect(fetchMock.mock.calls[0][1].headers.language, "no language defaults to English").toBe("en");
    expect(screen.getByText("Load More"), "more pages may follow").toBeInTheDocument();
  });

  it("reports a failed page and ignores taps while one is loading", async () => {
    let fail: (e: any) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((_, rej) => (fail = rej)));
    await renderList();
    const more = screen.getByText("Load More").parentElement as HTMLElement;
    await userEvent.click(more);
    await userEvent.click(more);
    expect(fetchMock, "a second tap during a load must not load again").toHaveBeenCalledTimes(1);
    fail(new Error("down"));
    await waitFor(() =>
      expect(LogError, "a failed page should be reported").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In GetNextComments in ProductBuyersCommentList" }),
      ),
    );
  });

  it("has no Load More when the first page is short or has no marker", async () => {
    await renderList({ comments: [{ id: 1, comment: "c1" }] });
    expect(screen.queryByText("Load More"), "a short first page is the whole list").toBeNull();
  });

  it("saves an edit, then patches the comment everywhere", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const spies = await renderList();
    await userEvent.click(screen.getByText("modal edit"));
    await waitFor(() => expect(texts(), "the edited text should be shown").toContain("edited"));
    expect((fetchData as any).mock.calls[0][0], "the edit should be sent to the comments backend").toEqual(
      expect.objectContaining({ method: "PUT", server: "comments" }),
    );
    expect(JSON.parse((fetchData as any).mock.calls[0][0].body), "the edit body should carry the owner").toEqual({
      text: "edited",
      rating: 5,
      owner_id: "2",
      owner_type: "user",
      comments_images_customer: [],
    });
    expect(spies.patchCommentEntity, "the shared entity should be patched").toHaveBeenCalledWith(1, {
      comment: "edited",
      star_rating: 5,
      comments_images_customer: [],
    });
    expect(spies.setBuyerCommentModalOption, "the modal should close").toHaveBeenCalledWith(null);
  });

  it("changes nothing when the backend refuses an edit or a delete", async () => {
    (fetchData as any).mockResolvedValue({ success: false });
    const spies = await renderList();
    await userEvent.click(screen.getByText("modal edit"));
    await userEvent.click(screen.getByText("modal delete"));
    await waitFor(() => expect(fetchData, "both requests should be sent").toHaveBeenCalledTimes(2));
    expect(spies.patchCommentEntity, "a refused edit must not change the comment").not.toHaveBeenCalled();
    expect(spies.removeCommentEntity, "a refused delete must not remove the comment").not.toHaveBeenCalled();
    expect(texts(), "the list must stay as it was").toContain("c1");
  });

  it("reports an edit or a delete that throws", async () => {
    (fetchData as any).mockRejectedValue(new Error("down"));
    await renderList();
    await userEvent.click(screen.getByText("modal edit"));
    await userEvent.click(screen.getByText("modal delete"));
    await waitFor(() => expect(LogError, "both failures should be reported").toHaveBeenCalledTimes(2));
    expect(LogError.mock.calls.map(([e]) => e.scenario), "each failure should name its action").toEqual([
      "Error In EditComment in ProductBuyersCommentList",
      "Error In deleteComment in ProductBuyersCommentList",
    ]);
  });

  it("deletes a comment and removes it everywhere", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const spies = await renderList();
    await userEvent.click(screen.getByText("modal delete"));
    await waitFor(() => expect(texts(), "the deleted comment should go").not.toContain("c1"));
    expect((fetchData as any).mock.calls[0][0].method, "the delete should be sent").toBe("DELETE");
    expect(spies.removeCommentEntity, "the shared entity should be removed").toHaveBeenCalledWith(1);
  });

  it("opens the edit dialog for a review, and its actions work", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const spies = await renderList({}, {
      BuyerCommentModalOption: { option: "Update", comment_type: "review", id: 1 },
    });
    expect(optionsProps.mock.calls[0][0].is_update, "Update should open the edit dialog").toBe(true);
    await userEvent.click(screen.getByText("options update"));
    await waitFor(() => expect(texts(), "the edit from the dialog should be shown").toContain("via options"));
    await userEvent.click(screen.getByText("options delete"));
    await waitFor(() => expect(spies.removeCommentEntity, "the dialog delete should remove it").toHaveBeenCalledWith(1));
    await userEvent.click(screen.getByText("options close"));
    expect(spies.setBuyerCommentModalOption, "close should clear the dialog").toHaveBeenLastCalledWith(null);
  });

  it("does not open the dialog for a question, or while the comments sheet is open", async () => {
    await renderList({}, { BuyerCommentModalOption: { option: "Update", comment_type: "faq" } });
    expect(optionsProps, "a FAQ edit is not this list's dialog").not.toHaveBeenCalled();
  });

  it("reloads the first page when told the comments changed", async () => {
    fetchMock.mockResolvedValueOnce(answer({ buyers_comments: [{ id: 50, comment: "fresh" }], offset: null }));
    const spies = await renderList({}, { shouldUpdateComment: true });
    await waitFor(() => expect(texts(), "the fresh comments should replace the old").toEqual(["fresh"]));
    expect(spies.setShouldUpdateComment, "the refresh flag should be cleared").toHaveBeenCalledWith(null);
  });

  it("reports a failed reload and still clears the flag", async () => {
    fetchMock.mockRejectedValueOnce(new Error("down"));
    const spies = await renderList({}, { shouldUpdateComment: true });
    await waitFor(() =>
      expect(LogError, "a failed reload should be reported").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In refreshComments in ProductBuyersCommentList" }),
      ),
    );
    expect(spies.setShouldUpdateComment, "the flag must be cleared even on failure").toHaveBeenCalledWith(null);
  });

  it("treats an empty reload answer as no comments", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({}) });
    await renderList({}, { shouldUpdateComment: true });
    await waitFor(() => expect(texts(), "an empty answer means no comments").toEqual([]));
  });
});
