// The FAQ row on a product page: the first questions, load more, the ask box,
// edit / delete, and a full refresh when another widget says questions changed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LogError = vi.fn();
const optionsProps = vi.fn();
const askProps = vi.fn();

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
vi.mock("hooks/useLiveColor", () => ({
  useLiveColor: (c: any) => `live-${c}`,
  useLiveParam: (_k: string, v: any) => `live-${v}`,
}));
vi.mock("components/Server/product/ProductFAQSection/FaqSectionModal", () => ({
  default: ({ editComment, deleteComment }: any) => (
    <div>
      <button onClick={() => editComment({ id: 1, comment: "edited", ownerID: 2, ownerType: "user" })}>
        modal edit
      </button>
      <button onClick={() => deleteComment(1)}>modal delete</button>
    </div>
  ),
}));
vi.mock("components/Server/product/ProductFAQSection/FaqItemComponent", () => ({
  default: ({ comment }: any) => (
    <div data-pw="question">{comment.comment ?? `new ${comment.id}`}</div>
  ),
}));
vi.mock("components/Server/product/ProductFAQSection/FaqAskInput", () => ({
  AskInput: (p: any) => {
    askProps(p);
    return <button onClick={() => p.setCommentsData({ id: 99, comment: "asked" })}>ask</button>;
  },
}));
vi.mock("components/Server/product/ProductFAQSection/FaqItemOptions", () => ({
  FaqItemOptions: (p: any) => {
    optionsProps(p);
    return (
      <div>
        <button onClick={() => p.updateAction({ id: 1, comment: "via options" })}>options update</button>
        <button onClick={() => p.deleteAction(1)}>options delete</button>
        <button onClick={() => p.handleCloseModal()}>options close</button>
      </div>
    );
  },
}));

import auth from "services/auth";
import { fetchData } from "utils/fetchData";
import FaqQuestionsList from "components/Server/product/ProductFAQSection/FaqQuestionsList";

import { renderWithProviders, screen, userEvent, waitFor } from "../../../../render";

const five = (from = 1) =>
  Array.from({ length: 5 }, (_, i) => ({ id: from + i, comment: `q${from + i}` }));
const fetchMock = vi.fn();
const answer = (data: any) => ({ json: async () => ({ data }) });
const questions = () =>
  Array.from(document.querySelectorAll('[data-pw="question"]')).map((n) => n.textContent);

const renderList = async (props: Record<string, any> = {}, store: Record<string, any> = {}) => {
  const spies = {
    BuyerCommentModalOption: null,
    setBuyerCommentModalOption: vi.fn(),
    shouldUpdateComment: null,
    setShouldUpdateComment: vi.fn(),
    ColorBottomSheet: false,
    setShouldUpdateCommentsCount: vi.fn(),
    patchCommentEntity: vi.fn(),
    removeCommentEntity: vi.fn(),
    appendedFaqIds: {},
    ...store,
  };
  await renderWithProviders(
    <FaqQuestionsList
      comments={five()}
      offset={[5]}
      loadMoreString="Load More"
      language="en"
      productId={9}
      owner_id={7}
      owner_type="shop"
      color="red"
      size="M"
      filterKeys={[]}
      {...props}
    />,
    { store: spies },
  );
  return spies;
};

describe("the FAQ row", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    (fetchData as any).mockReset();
    LogError.mockReset();
    optionsProps.mockClear();
    askProps.mockClear();
    (auth.UserID as any).mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("loads the next page and hides Load More at the end", async () => {
    (auth.UserID as any).mockReturnValue(4);
    fetchMock.mockResolvedValueOnce(answer({ fqa_comments: [{ id: 6, comment: "q6" }], offset: null }));
    await renderList();
    await userEvent.click(screen.getByText("Load More"));
    await waitFor(() => expect(questions(), "the next question should be added").toContain("q6"));
    expect(fetchMock.mock.calls[0][0], "the shopper's id should be sent").toContain("user_id=4");
    expect(fetchMock.mock.calls[0][0], "the page marker should be sent").toContain("offset=");
    expect(screen.queryByText("Load More"), "no marker means the end").toBeNull();
  });

  it("keeps Load More while pages keep coming, for a guest with no language", async () => {
    fetchMock.mockResolvedValueOnce(answer({ fqa_comments: five(6), offset: [10] }));
    await renderList({ language: undefined });
    await userEvent.click(screen.getByText("Load More"));
    await waitFor(() => expect(questions(), "the next page should be added").toContain("q10"));
    expect(fetchMock.mock.calls[0][0], "a guest sends no user id").not.toContain("user_id");
    expect(fetchMock.mock.calls[0][1].headers.language, "no language defaults to English").toBe("en");
    expect(screen.getByText("Load More"), "more pages may follow").toBeInTheDocument();
  });

  it("reports a failed page and ignores taps while loading", async () => {
    let fail: (e: any) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((_, rej) => (fail = rej)));
    await renderList({ language: "ar" });
    const more = screen.getByText("Load More").parentElement as HTMLElement;
    await userEvent.click(more);
    await userEvent.click(more);
    expect(fetchMock, "a second tap during a load must not load again").toHaveBeenCalledTimes(1);
    fail(new Error("down"));
    await waitFor(() =>
      expect(LogError, "a failed page should be reported").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In GetNextComments in FaqQuestionsList" }),
      ),
    );
  });

  it("puts a newly asked question first, and passes the live colour and size to the ask box", async () => {
    await renderList({ comments: [{ id: 1, comment: "q1" }] });
    expect(askProps.mock.calls[0][0], "the ask box should get the live colour and size").toEqual(
      expect.objectContaining({ color: "live-red", size: "live-M", owner_id: 7, productId: 9 }),
    );
    expect(screen.queryByText("Load More"), "a short first page is the whole list").toBeNull();
    await userEvent.click(screen.getByText("ask"));
    expect(questions(), "the asked question should be first").toEqual(["asked", "q1"]);
  });

  it("shows questions asked in another widget, once each", async () => {
    await renderList({}, { appendedFaqIds: { "9": ["n1", 1] } });
    expect(questions()[0], "the other widget's question should be shown on top").toBe("new n1");
    expect(questions().filter((q) => q === "q1").length, "a loaded question must not repeat").toBe(1);
  });

  it("saves an edit and patches the question everywhere", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const spies = await renderList();
    await userEvent.click(screen.getByText("modal edit"));
    await waitFor(() => expect(questions(), "the edit should show").toContain("edited"));
    expect(JSON.parse((fetchData as any).mock.calls[0][0].body), "the edit should carry the owner").toEqual(
      expect.objectContaining({ text: "edited", owner_id: "2", owner_type: "user", comments_images_customer: [] }),
    );
    expect(spies.patchCommentEntity, "the shared question should be patched").toHaveBeenCalledWith(1, { comment: "edited" });
  });

  it("deletes a question and refreshes the count", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const spies = await renderList();
    await userEvent.click(screen.getByText("modal delete"));
    await waitFor(() => expect(questions(), "the deleted question should go").not.toContain("q1"));
    expect(spies.removeCommentEntity, "the shared question should be removed").toHaveBeenCalledWith(1);
    expect(spies.setShouldUpdateCommentsCount, "the question count should refresh").toHaveBeenCalledWith(true);
  });

  it("changes nothing when the backend refuses, and reports a throw", async () => {
    (fetchData as any).mockResolvedValue({ success: false });
    const spies = await renderList();
    await userEvent.click(screen.getByText("modal edit"));
    await userEvent.click(screen.getByText("modal delete"));
    await waitFor(() => expect(fetchData, "both requests should be sent").toHaveBeenCalledTimes(2));
    expect(spies.patchCommentEntity, "a refused edit must change nothing").not.toHaveBeenCalled();
    expect(spies.removeCommentEntity, "a refused delete must change nothing").not.toHaveBeenCalled();

    (fetchData as any).mockRejectedValue(new Error("down"));
    await userEvent.click(screen.getByText("modal edit"));
    await userEvent.click(screen.getByText("modal delete"));
    await waitFor(() => expect(LogError, "both failures should be reported").toHaveBeenCalledTimes(2));
    expect(LogError.mock.calls.map(([e]) => e.scenario), "each failure names its action").toEqual([
      "Error In EditComment in FaqQuestionsList",
      "Error In deleteComment in FaqQuestionsList",
    ]);
  });

  it("opens the dialog for a question, and its actions work", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const spies = await renderList({}, { BuyerCommentModalOption: { option: "Delete", comment_type: "faq", id: 1 } });
    expect(optionsProps.mock.calls[0][0].is_delete, "Delete should open the delete dialog").toBe(true);
    await userEvent.click(screen.getByText("options update"));
    await waitFor(() => expect(questions(), "the dialog edit should show").toContain("via options"));
    await userEvent.click(screen.getByText("options delete"));
    await waitFor(() =>
      expect(spies.setShouldUpdateComment, "other lists should be told").toHaveBeenCalledWith({ fromComments: true }),
    );
    await userEvent.click(screen.getByText("options close"));
    expect(spies.setBuyerCommentModalOption, "close should clear the dialog").toHaveBeenLastCalledWith(null);
  });

  it("does not open the dialog while the FAQ sheet is open", async () => {
    await renderList({}, {
      ColorBottomSheet: { is_for_faq: true },
      BuyerCommentModalOption: { option: "Update", comment_type: "faq" },
    });
    expect(optionsProps, "the sheet shows its own dialog").not.toHaveBeenCalled();
  });

  it("reloads the first page when told questions changed, and clears the flag", async () => {
    fetchMock.mockResolvedValueOnce(answer({ fqa_comments: [{ id: 50, comment: "fresh" }], offset: null }));
    const spies = await renderList({}, { shouldUpdateComment: true });
    await waitFor(() => expect(questions(), "the fresh questions should replace the old").toEqual(["fresh"]));
    expect(spies.setShouldUpdateComment, "the flag should be cleared").toHaveBeenCalledWith(null);
  });

  it("reports a failed reload, and treats an empty answer as none", async () => {
    fetchMock.mockRejectedValueOnce(new Error("down"));
    await renderList({}, { shouldUpdateComment: true });
    await waitFor(() =>
      expect(LogError, "a failed reload should be reported").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In refreshFaqComments in FaqQuestionsList" }),
      ),
    );
  });

  it("treats an empty reload answer as no questions", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({}) });
    await renderList({}, { shouldUpdateComment: true });
    await waitFor(() => expect(questions(), "an empty answer means no questions").toEqual([]));
  });
});
