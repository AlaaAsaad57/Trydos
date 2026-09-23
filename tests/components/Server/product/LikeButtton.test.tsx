// The heart under a buyer comment or a question. A tap likes or unlikes at once
// on screen, tells the comments backend, and puts the old state back if the
// backend refuses. A guest is asked to sign in instead.
import { beforeEach, describe, expect, it, vi } from "vitest";

const LikeComment = vi.fn();
const UnLikeComment = vi.fn();
const showErrorNotification = vi.fn();
const LogError = vi.fn();

vi.mock("services/home", () => ({
  default: {
    LikeComment: (...args: any[]) => LikeComment(...args),
    UnLikeComment: (...args: any[]) => UnLikeComment(...args),
  },
}));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  showErrorNotification: (...args: any[]) => showErrorNotification(...args),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));

import { LikeButton } from "components/Server/product/LikeButtton";

import { renderWithProviders, userEvent, waitFor } from "../../../render";

const heart = () => document.querySelector('[data-pw="comment-like"]') as HTMLElement;
const count = () => document.querySelector('[data-pw="comment-like-count"]')?.textContent;

const renderHeart = (props: Record<string, any> = {}, store: Record<string, any> = {}) => {
  const spies = { setLoginOpen: vi.fn(), patchCommentEntity: vi.fn() };
  return renderWithProviders(
    <LikeButton
      comment_id={12}
      target_type="comment"
      productId={3}
      is_liked={false}
      total_likes={4}
      {...props}
    />,
    { store: { userProfile: { id: 1 }, ...spies, ...store } },
  ).then((r) => ({ ...r, ...spies }));
};

describe("the comment like heart", () => {
  beforeEach(() => {
    LikeComment.mockReset().mockResolvedValue(undefined);
    UnLikeComment.mockReset().mockResolvedValue(undefined);
    showErrorNotification.mockReset();
    LogError.mockReset();
  });

  it("asks a guest to sign in and changes nothing", async () => {
    const { setLoginOpen } = await renderHeart({}, { userProfile: null });
    await userEvent.click(heart());
    expect(setLoginOpen, "a guest should be sent to sign in").toHaveBeenCalledWith(true);
    expect(showErrorNotification, "a guest should be told to sign in first").toHaveBeenCalled();
    expect(LikeComment, "a guest must not like anything").not.toHaveBeenCalled();
  });

  it("likes a comment, counts it at once, and shares the new state with other widgets", async () => {
    const { patchCommentEntity } = await renderHeart();
    await userEvent.click(heart());
    expect(heart().getAttribute("data-liked"), "the heart should fill at once").toBe("true");
    expect(count(), "the count should go up by one").toBe("5");
    expect(patchCommentEntity, "other widgets should get the new state").toHaveBeenCalledWith("12", {
      is_liked: true,
      total_likes: 5,
    });
    await waitFor(() =>
      expect(LikeComment, "the comments backend should be told about the like").toHaveBeenCalledWith({
        comment_id: 12,
        target_type: "comment",
        product_id: 3,
      }),
    );
    expect(heart().id, "a comment heart's id ends in reaction").toBe("12reaction");
  });

  it("unlikes a seller reply under the parent comment's id", async () => {
    const { patchCommentEntity } = await renderHeart({
      comment_id: "12-seller_reply",
      target_type: "seller_reply",
      is_liked: true,
      total_likes: 2,
    });
    await userEvent.click(heart());
    await waitFor(() => expect(UnLikeComment, "the unlike should reach the comments backend").toHaveBeenCalled());
    expect(patchCommentEntity, "a reply's like lives on the parent comment's reply fields").toHaveBeenCalledWith("12", {
      reply_is_liked: false,
      reply_total_likes: 1,
    });
    expect(heart().id, "a reply heart's id is marked as a reply").toBe("12-seller_replyreplyreaction");
  });

  it("puts the old state back and reports it when the comments backend refuses", async () => {
    LikeComment.mockRejectedValue(new Error("refused"));
    const { patchCommentEntity } = await renderHeart();
    await userEvent.click(heart());
    await waitFor(() => expect(LogError, "the refusal should be reported").toHaveBeenCalled());
    expect(heart().getAttribute("data-liked"), "a refused like must not stay filled").toBe("false");
    expect(count(), "a refused like must not stay counted").toBe("4");
    expect(patchCommentEntity, "other widgets should be put back too").toHaveBeenLastCalledWith("12", {
      is_liked: false,
      total_likes: 4,
    });
  });

  it("ignores a second tap while the first is still animating", async () => {
    await renderHeart();
    await userEvent.click(heart());
    await userEvent.click(heart());
    expect(LikeComment, "a double tap must send one like, not a like and an unlike").toHaveBeenCalledTimes(1);
    expect(UnLikeComment, "a double tap must not send an unlike").not.toHaveBeenCalled();
  });

  it("follows new values handed down by the list", async () => {
    const { rerender } = await renderHeart();
    rerender(
      <LikeButton comment_id={12} target_type="comment" productId={3} is_liked total_likes={9} />,
    );
    await waitFor(() => expect(count(), "the count should follow the list").toBe("9"));
    expect(heart().getAttribute("data-liked"), "the liked state should follow the list").toBe("true");
  });

  it("BUG-server-30: draws a comment that has no like count yet as 0", async () => {
    await renderHeart({ total_likes: undefined, is_liked: undefined });
    await waitFor(() => expect(count(), "a comment without a like count should show 0").toBe("0"));
  });
});
