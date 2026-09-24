// The full FAQ sheet: all questions for a product, a filter per question kind,
// load more, and the edit / delete dialogs for the shopper's own questions.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LogError = vi.fn();
const optionsProps = vi.fn();

vi.mock("services/auth", async () => {
  const { makeMockAuthModule } = await import("../../../../mocks/auth");
  return makeMockAuthModule();
});
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...a: any[]) => LogError(...a),
}));
vi.mock("components/global/BottomSheet", () => ({
  default: ({ children, onClose }: any) => (
    <div>
      <button onClick={onClose}>close sheet</button>
      {children}
    </div>
  ),
}));
vi.mock("components/Server/product/ProductFAQSection/FaqItemComponent", () => ({
  default: ({ comment }: any) => (
    <div data-pw="question">{comment.comment ?? `new ${comment.id}`}</div>
  ),
}));
vi.mock("components/Server/product/ProductFAQSection/FaqItemOptions", () => ({
  FaqItemOptions: (p: any) => {
    optionsProps(p);
    return (
      <div>
        <button onClick={() => p.updateAction({ id: 1, comment: "edited" })}>options update</button>
        <button onClick={() => p.deleteAction(1)}>options delete</button>
        <button onClick={() => p.handleCloseModal()}>options close</button>
      </div>
    );
  },
}));

import auth from "services/auth";
import FaqSectionModal from "components/Server/product/ProductFAQSection/FaqSectionModal";

import { renderWithProviders, screen, userEvent, waitFor } from "../../../../render";

const fetchMock = vi.fn();
const answer = (data: any) => ({ json: async () => ({ data }) });
const questions = () =>
  Array.from(document.querySelectorAll('[data-pw="question"]')).map((n) => n.textContent);

const renderSheet = async (props: Record<string, any> = {}, store: Record<string, any> = {}) => {
  const spies = {
    setColorBottomSheet: vi.fn(),
    setBuyerCommentModalOption: vi.fn(),
    setShouldUpdateComment: vi.fn(),
    deleteComment: vi.fn(),
    editComment: vi.fn(),
  };
  const result = await renderWithProviders(
    <FaqSectionModal
      filters_key={["size", "material"]}
      productId={9}
      deleteComment={spies.deleteComment}
      editComment={spies.editComment}
      {...props}
    />,
    {
      store: {
        ColorBottomSheet: { is_for_faq: true },
        setColorBottomSheet: spies.setColorBottomSheet,
        BuyerCommentModalOption: null,
        setBuyerCommentModalOption: spies.setBuyerCommentModalOption,
        setShouldUpdateComment: spies.setShouldUpdateComment,
        appendedFaqIds: {},
        ...store,
      },
    },
  );
  return { ...spies, ...result };
};

describe("the FAQ sheet", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    LogError.mockReset();
    optionsProps.mockClear();
    (auth.UserID as any).mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("loads the questions when opened, and more on Load More", async () => {
    (auth.UserID as any).mockReturnValue(4);
    fetchMock
      .mockResolvedValueOnce(answer({ fqa_comments: [{ id: 1, comment: "q1" }], offset: [1] }))
      .mockResolvedValueOnce(answer({ fqa_comments: [{ id: 2, comment: "q2" }], offset: null }));
    await renderSheet({}, { language: "ar" });
    await waitFor(() => expect(questions(), "the first questions should show").toEqual(["q1"]));
    expect(fetchMock.mock.calls[0][0], "the shopper's id should be sent").toContain("user_id=4");
    expect(fetchMock.mock.calls[0][1].headers.language, "the store language should be sent").toBe("ar");
    await userEvent.click(screen.getByText("Load More"));
    await waitFor(() => expect(questions(), "the next page should be added").toEqual(["q1", "q2"]));
    expect(fetchMock.mock.calls[1][0], "the next page should send the page marker").toContain("offset=");
    expect(screen.queryByText("Load More"), "no marker means the end").toBeNull();
  });

  it("filters by a question kind, and a second tap removes the filter", async () => {
    fetchMock.mockResolvedValue(answer({ fqa_comments: [], offset: null }));
    await renderSheet();
    await waitFor(() => expect(fetchMock, "the sheet should load on open").toHaveBeenCalledTimes(1));
    expect(screen.getByText("There is No Comments Yet.."), "an empty list should say so").toBeInTheDocument();
    await userEvent.click(screen.getByText("size"));
    await waitFor(() => expect(fetchMock, "the filter should reload").toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0], "the chosen kind should be sent").toContain("filter=size");
    expect(screen.getByText("size").className, "the chosen kind should be highlighted").toContain("bg-[#bdd3ff]");
    await userEvent.click(screen.getByText("size"));
    await waitFor(() => expect(fetchMock, "a second tap should reload").toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2][0], "a second tap removes the filter").not.toContain("filter=");
  });

  it("ignores a filter tap while loading", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    await renderSheet();
    await userEvent.click(screen.getByText("size"));
    expect(fetchMock, "a tap during a load must not load again").toHaveBeenCalledTimes(1);
  });

  it("reports a failed load", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    await renderSheet();
    await waitFor(() =>
      expect(LogError, "a failed load should be reported").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In loadMore Faq Questions in FaqSectionModal" }),
      ),
    );
  });

  it("shows questions asked elsewhere this session, once each, and treats an empty answer as none", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({}) });
    await renderSheet({}, { appendedFaqIds: { "9": ["n1"] }, language: undefined });
    await waitFor(() => expect(questions(), "the new question should be shown").toEqual(["new n1"]));
    expect(fetchMock.mock.calls[0][1].headers.language, "no language defaults to English").toBe("en");
  });

  it("does not show a question twice when it was also loaded", async () => {
    fetchMock.mockResolvedValue(answer({ fqa_comments: [{ id: "n1", comment: "loaded n1" }] }));
    await renderSheet({}, { appendedFaqIds: { "9": ["n1", "n2"] } });
    await waitFor(() =>
      expect(questions(), "a loaded question must not be repeated from the session list").toEqual([
        "new n2",
        "loaded n1",
      ]),
    );
  });

  it("closes through the store", async () => {
    fetchMock.mockResolvedValue(answer({ fqa_comments: [] }));
    const { setColorBottomSheet } = await renderSheet();
    await userEvent.click(screen.getByText("close sheet"));
    expect(setColorBottomSheet, "closing should clear the open sheet").toHaveBeenCalledWith(false);
  });

  it("draws nothing while the sheet is closed", async () => {
    const { container } = await renderSheet({}, { ColorBottomSheet: false });
    expect(container.innerHTML, "a closed sheet draws nothing").toBe("");
    expect(fetchMock, "a closed sheet loads nothing").not.toHaveBeenCalled();
  });

  it("edits and deletes the shopper's own question from the dialog", async () => {
    fetchMock.mockResolvedValue(answer({ fqa_comments: [{ id: 1, comment: "q1" }, { id: 2, comment: "q2" }] }));
    const spies = await renderSheet({}, { BuyerCommentModalOption: { option: "Update", comment_type: "faq", id: 1 } });
    await waitFor(() => expect(questions(), "the questions should load").toEqual(["q1", "q2"]));
    expect(optionsProps.mock.calls[0][0].is_update, "Update should open the edit dialog").toBe(true);

    spies.editComment.mockResolvedValueOnce({ id: 1, comment: { id: 1, comment: "edited" } });
    await userEvent.click(screen.getByText("options update"));
    await waitFor(() => expect(questions(), "the edit should replace the question").toEqual(["edited", "q2"]));

    spies.editComment.mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getByText("options update"));
    expect(questions(), "a refused edit must change nothing").toEqual(["edited", "q2"]);

    spies.deleteComment.mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getByText("options delete"));
    await waitFor(() => expect(spies.setShouldUpdateComment, "other lists should refresh").toHaveBeenCalled());
    expect(questions(), "a refused delete must keep the question").toEqual(["edited", "q2"]);

    spies.deleteComment.mockResolvedValueOnce(1);
    await userEvent.click(screen.getByText("options delete"));
    await waitFor(() => expect(questions(), "the deleted question should go").toEqual(["q2"]));
    expect(spies.setShouldUpdateComment, "other lists should be told").toHaveBeenLastCalledWith({ fromComments: true });

    await userEvent.click(screen.getByText("options close"));
    expect(spies.setBuyerCommentModalOption, "close should clear the dialog").toHaveBeenCalledWith(null);
  });

  it("does not open the dialog for a review", async () => {
    fetchMock.mockResolvedValue(answer({ fqa_comments: [] }));
    await renderSheet({}, { BuyerCommentModalOption: { option: "Delete", comment_type: "review" } });
    expect(optionsProps, "a review edit is not this sheet's dialog").not.toHaveBeenCalled();
  });
});
