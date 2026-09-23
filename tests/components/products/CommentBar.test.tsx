// The "type a comment" bar under a product's questions. It posts the question
// to the comments backend and, on success, puts it on top of this list and of
// every other FAQ widget (appendFaqComment) without reloading from
// Elasticsearch.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import CommentBar from "components/products/CommentBar";
import { CREATE_COMMENT_URL } from "utils/endpointConfig";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...a: any[]) => fetchData(...a),
  abortInFlightForLogout: vi.fn(),
}));

vi.mock("services/auth", () => ({
  default: { UserID: () => 7, User: () => ({ name: "Rana", image: "/r.jpg", phone: "p" }) },
}));

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

const PRODUCT = { id: 42, owner_id: 3, owner_type: "shop", color: "Red", size: "M" };

async function renderBar(store: any = {}) {
  const setCommentsData = vi.fn();
  const appendFaqComment = vi.fn();
  const view = await renderWithProviders(
    <div className="comments-extended">
      <CommentBar product_data={PRODUCT} setCommentsData={setCommentsData} />
    </div>,
    { store: { userProfile: { need_auth: false }, appendFaqComment, shouldUpdateComment: { x: 1 }, ...store } },
  );
  return { ...view, setCommentsData, appendFaqComment };
}

const box = () => document.querySelector('[data-pw="CommentField"]') as HTMLTextAreaElement;
const sentBody = (i = 0) => JSON.parse(fetchData.mock.calls[i][0].body);

// Posting scrolls `.comments-extended` to the top 300 ms later. In the app the
// bar always sits inside that list; here the test's own copy is unmounted at
// the end of each case, so a spare copy stays on the page until every timer
// has fired — otherwise a late timer finds nothing and throws.
let spareList: HTMLElement;
beforeAll(() => {
  spareList = document.createElement("div");
  spareList.className = "comments-extended";
  document.body.appendChild(spareList);
});
afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  spareList.remove();
});

describe("CommentBar", () => {
  beforeEach(() => {
    fetchData.mockReset();
    fetchData.mockResolvedValue({ success: true, data: { comment_id: "c1" } });
    showErrorNotification.mockReset();
    logError.mockReset();
  });

  it("clears a pending FAQ reload on mount", async () => {
    const { store } = await renderBar();
    expect(store.getState().shouldUpdateComment, "the pending reload was not cleared").toBeNull();
  });

  it("posts a question with Enter and puts it on top everywhere", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { setCommentsData, appendFaqComment, store } = await renderBar();
    fireEvent.change(box(), { target: { value: "Does it run small?" } });
    fireEvent.input(box());
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() => expect(setCommentsData, "the new question was not put on top").toHaveBeenCalled());

    const [params] = fetchData.mock.calls[0];
    expect(params.url, "the question was not posted to the create address").toBe(CREATE_COMMENT_URL);
    expect(params.server, "the question did not go to the comments backend").toBe("comments");
    expect(sentBody(), "the question body is wrong").toEqual(
      expect.objectContaining({
        text: "Does it run small?",
        product_id: "42",
        user_id: "7",
        user_name: "Rana",
        owner_id: "3",
        owner_type: "shop",
        variant: "Red-M",
      }),
    );
    expect(setCommentsData.mock.calls[0][0], "the local question is wrong").toEqual(
      expect.objectContaining({ id: "c1", comment: "Does it run small?", isOwner: true }),
    );
    expect(appendFaqComment, "the other FAQ widgets were not told").toHaveBeenCalledWith(42, expect.objectContaining({ id: "c1" }));
    expect(store.getState().shouldUpdateCommentsCount, "the count was not bumped").toBe(true);
    expect(box().value, "the box was not cleared").toBe("");

    const list = document.querySelector(".comments-extended") as HTMLElement;
    list.scrollTop = 50;
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(list.scrollTop, "the list was not scrolled to the top").toBe(0);
    vi.useRealTimers();
  });

  it("does not post with Shift+Enter", async () => {
    await renderBar();
    fireEvent.change(box(), { target: { value: "Line" } });
    fireEvent.keyDown(box(), { key: "Enter", shiftKey: true });
    expect(fetchData, "Shift+Enter posted").not.toHaveBeenCalled();
  });

  it("posts from the send arrow, which points the other way for Arabic text", async () => {
    await renderBar();
    expect(document.querySelector('[data-pw="SubmitComment"]'), "the arrow showed for an empty box").toBeNull();
    fireEvent.change(box(), { target: { value: "مقاس" } });
    const arrow = document.querySelector('[data-pw="SubmitComment"]') as HTMLElement;
    expect(arrow.className, "the arrow does not flip for Arabic").toContain("rotate-180");
    fireEvent.click(arrow);
    await waitFor(() => expect(fetchData, "the arrow did not post").toHaveBeenCalledTimes(1));
  });

  it("ignores the arrow while posting", async () => {
    let finish: (v: any) => void = () => {};
    fetchData.mockReturnValueOnce(new Promise((r) => (finish = r)));
    await renderBar();
    fireEvent.change(box(), { target: { value: "Hello" } });
    const arrow = document.querySelector('[data-pw="SubmitComment"]') as HTMLElement;
    fireEvent.click(arrow);
    fireEvent.click(arrow);
    expect(fetchData, "a second click posted twice").toHaveBeenCalledTimes(1);
    await act(async () => finish({ success: true, data: { comment_id: "c" } }));
  });

  it("asks an unverified shopper to verify the phone first", async () => {
    await renderBar({ userProfile: { need_auth: true } });
    fireEvent.change(box(), { target: { value: "Hi" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(showErrorNotification, "an unverified shopper was not asked to verify").toHaveBeenCalledWith(
      "Please Verify Your Phone Number",
    );
    expect(fetchData, "an unverified shopper posted").not.toHaveBeenCalled();
  });

  it("logs and keeps the text when the comments backend refuses", async () => {
    fetchData.mockResolvedValue({ success: false, message: "blocked" });
    const { setCommentsData } = await renderBar();
    fireEvent.change(box(), { target: { value: "Hi" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() => expect(logError, "the refusal was not logged").toHaveBeenCalled());
    expect(setCommentsData, "a refused question was added").not.toHaveBeenCalled();
    expect(box().value, "a refused question was cleared").toBe("Hi");
  });

  it("logs when the backend answers without a comment id", async () => {
    fetchData.mockResolvedValue({ success: true, data: {} });
    await renderBar();
    fireEvent.change(box(), { target: { value: "Hi" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() =>
      expect(logError.mock.calls[0]?.[0].error.message, "a missing id was not treated as a failure").toBe(
        "Failed to create comment",
      ),
    );
  });

  // BUG-products-4: CommentBar.tsx lines 128-133 and 23-59. Enter calls
  // addComment with no check on the text, so an empty box posts an empty
  // question to the comments backend.
  it("BUG-products-4: Enter in an empty comment box must not post an empty question", async () => {
    await renderBar();
    fireEvent.keyDown(box(), { key: "Enter" });
    await act(async () => {});
    expect(fetchData, "an empty question was posted to the comments backend").not.toHaveBeenCalled();
  });

  // BUG-products-5: CommentBar.tsx lines 146-149. The box shows only the first
  // 200 characters (value={val.slice(0, 200)}), but `val` keeps the whole
  // pasted text and that is what is posted — the shopper sends text they
  // cannot see.
  it("BUG-products-5: a pasted question longer than 200 characters must be posted as shown (200 characters)", async () => {
    await renderBar();
    fireEvent.change(box(), { target: { value: "x".repeat(300) } });
    expect(box().value.length === 200, "the box does not show 200 characters").toBe(true);
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() => expect(fetchData).toHaveBeenCalled());
    expect(
      sentBody().text.length <= 200,
      `the posted question has ${sentBody().text.length} characters, more than the 200 shown`,
    ).toBe(true);
  });
});
