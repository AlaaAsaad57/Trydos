// The questions (FAQ comments) panel on a product. It reads pages from the
// app's own route (/api/products/comments/fqa_comments), shows questions asked
// this session first, reloads when another widget says so, and gives a
// signed-in shopper the comment bar.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CommentSection from "components/products/CommentSection";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { UserID } = vi.hoisted(() => ({ UserID: vi.fn() }));
vi.mock("services/auth", () => ({ default: { UserID } }));

const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => logError(...a),
}));

vi.mock("components/Server/product/ProductFAQSection/FaqItemComponent", () => ({
  default: ({ id, comment, isRtl }: any) => (
    <div data-testid="faq" data-rtl={String(isRtl)}>
      {comment.text ?? `appended ${id}`}
    </div>
  ),
}));
vi.mock("components/products/CommentBar", () => ({
  default: ({ setCommentsData }: any) => (
    <button onClick={() => setCommentsData({ id: "new", text: "My question" })}>comment bar</button>
  ),
}));

const PRODUCT = { id: 42, name: "Shoe", offer_price: 8, brand: { id: 1, name: "B" }, categories: [{ id: 2, name: "C" }] };

const fetchMock = vi.fn();
const page = (comments: any[], total: number, offset: any = null) => ({
  json: async () => ({ data: { fqa_comments: comments, total, offset } }),
});
const params = (i: number) => new URL(fetchMock.mock.calls[i][0], "http://x").searchParams;
const texts = () => screen.queryAllByTestId("faq").map((el) => el.textContent);

describe("CommentSection", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    GAevent.mockReset();
    logError.mockReset();
    UserID.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports the view, loads the first page for the user, and pages with Load More", async () => {
    UserID.mockReturnValue(7);
    fetchMock
      .mockResolvedValueOnce(page([{ id: "a", text: "Q1" }], 2, { after: 1 }))
      .mockResolvedValueOnce(page([{ id: "b", text: "Q2" }], 2));
    await renderWithProviders(<CommentSection product_data={PRODUCT} />, {
      store: { user: { id: 7, phone: "1" } },
      language: "ar",
    });
    await screen.findByText("Q1");
    expect(GAevent, "the view was not reported").toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ item_id: 42, category_id: 2 }) }),
    );
    expect(params(0).get("product_id"), "the product was not asked for").toBe("42");
    expect(params(0).get("user_id"), "the user was not sent").toBe("7");
    expect(fetchMock.mock.calls[0][1].headers.language, "the language header is wrong").toBe("ar");
    expect(screen.getByTestId("faq").dataset.rtl, "Arabic is not right-to-left").toBe("true");
    expect(screen.getByText("comment bar"), "a signed-in shopper has no comment bar").toBeInTheDocument();

    fireEvent.click(screen.getByText("تحميل المزيد"));
    await waitFor(() => expect(texts(), "Load More did not add the next page").toEqual(["Q1", "Q2"]));
    expect(decodeURIComponent(params(1).get("offset")!), "the offset was not sent").toBe(
      JSON.stringify({ after: 1 }),
    );
    expect(screen.queryByText("تحميل المزيد"), "Load More showed after the last page").not.toBeInTheDocument();
  });

  it("asks a guest to log in and gives no comment bar", async () => {
    fetchMock.mockResolvedValue(page([], 0));
    await renderWithProviders(<CommentSection product_data={PRODUCT} />, { store: { user: null } });
    expect(screen.getByText("Please Login So You Can Add A Comment"), "a guest is not asked to log in").toBeInTheDocument();
    expect(screen.queryByText("comment bar"), "a guest got the comment bar").not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock, "the page was not loaded").toHaveBeenCalled());
    expect(params(0).get("user_id"), "a guest sent a user id").toBeNull();
  });

  it("treats a placeholder account (phone '0') as a guest", async () => {
    fetchMock.mockResolvedValue(page([], 0));
    await renderWithProviders(<CommentSection product_data={PRODUCT} />, { store: { user: { phone: "0" } } });
    expect(screen.getByText("Please Login So You Can Add A Comment"), "a placeholder account can comment").toBeInTheDocument();
  });

  it("shows this session's new questions first, without repeating loaded ones", async () => {
    fetchMock.mockResolvedValue(page([{ id: "a", text: "Q1" }], 1));
    await renderWithProviders(<CommentSection product_data={PRODUCT} />, {
      store: { user: { phone: "1" }, appendedFaqIds: { "42": ["x", "a"] } },
    });
    await screen.findByText("Q1");
    expect(texts(), "the session question is not first, or a loaded one repeated").toEqual(["appended x", "Q1"]);
  });

  it("puts a question written in the comment bar on top", async () => {
    fetchMock.mockResolvedValue(page([{ id: "a", text: "Q1" }], 1));
    await renderWithProviders(<CommentSection product_data={PRODUCT} />, { store: { user: { phone: "1" } } });
    await screen.findByText("Q1");
    fireEvent.click(screen.getByText("comment bar"));
    expect(texts(), "the new question is not on top").toEqual(["My question", "Q1"]);
  });

  it("reloads from the start when another widget asks for it", async () => {
    fetchMock.mockResolvedValueOnce(page([{ id: "a", text: "Q1" }], 1)).mockResolvedValueOnce(page([{ id: "z", text: "Fresh" }], 1));
    const { store } = await renderWithProviders(<CommentSection product_data={PRODUCT} />, {
      store: { user: { phone: "1" } },
    });
    await screen.findByText("Q1");
    store.getState().setShouldUpdateComment({ fromFaq: true });
    await screen.findByText("Fresh");
    expect(texts(), "the reload kept the old page").toEqual(["Fresh"]);
    expect(store.getState().shouldUpdateComment, "the reload request was not cleared").toBeNull();
  });

  it("logs a page that could not be read and stops the skeleton", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const { container } = await renderWithProviders(<CommentSection product_data={PRODUCT} />, {
      store: { user: null },
    });
    await waitFor(() => expect(logError, "the failed page was not logged").toHaveBeenCalled());
    await waitFor(() =>
      expect(container.querySelector(".extended-bar-top .ml-2"), "the spinner stayed after the error").toBeNull(),
    );
  });
});
