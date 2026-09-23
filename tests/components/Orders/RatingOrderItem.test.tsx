// The "Rate Your Experience" sheet for one order line. The shopper picks stars,
// writes a comment, adds photos, and submits; the rating goes to the market
// backend through services/order and the order list is refreshed.
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RatingOrderItem from "components/Orders/RatingOrderItem";
import { routerSpies } from "../../mocks/nextNavigation";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { order } = vi.hoisted(() => ({ order: { RateOrderWithhComment: vi.fn() } }));
vi.mock("services/order", () => ({ default: order }));

const trackOrderMgmt = vi.fn();
vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackOrderMgmt: (...a: any[]) => trackOrderMgmt(...a),
}));

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => logError(...a),
}));

vi.mock("components/settings/cards/RatingStars", () => ({
  default: ({ onRatingChange, initialRating }: any) => (
    <div data-testid="stars" data-rating={initialRating}>
      <button onClick={() => onRatingChange(4)}>4 stars</button>
    </div>
  ),
}));
vi.mock("components/Orders/UploadImageComponent", () => ({
  default: ({ images, setImages, removeImageAction }: any) => (
    <div data-testid="photos" data-images={images.join(",")}>
      <button onClick={() => setImages([...images, "new.webp"])}>add photo</button>
      <button onClick={() => removeImageAction(images[0])}>remove first</button>
    </div>
  ),
}));

/** Holds `loading` like the real parent (OrderItemsList). */
function Harness(props: any) {
  const [loading, setLoading] = useState(props.startLoading ?? false);
  return <RatingOrderItem {...props} loading={loading} setLoading={setLoading} />;
}

async function openSheet(extra: any = {}) {
  const refresh = vi.fn();
  const setShowCommentModal = vi.fn();
  await renderWithProviders(
    <Harness
      productId={5}
      order_detail_id={50}
      isRated={false}
      initialRating={0}
      refresh={refresh}
      variant="Red-M"
      owner_id={3}
      owner_type="shop"
      setShowCommentModal={setShowCommentModal}
      {...extra}
    />,
  );
  return { refresh, setShowCommentModal };
}

const commentBox = () => screen.getByLabelText("Comment input") as HTMLTextAreaElement;
const submit = () => screen.getByText(/Submit Rating|Update Rating/).closest("button") as HTMLButtonElement;

describe("RatingOrderItem", () => {
  beforeEach(() => {
    order.RateOrderWithhComment.mockReset();
    order.RateOrderWithhComment.mockResolvedValue(undefined);
    trackOrderMgmt.mockReset();
    logError.mockReset();
    routerSpies.refresh.mockClear();
  });

  it("needs both stars and a comment, then sends the rating and refreshes", async () => {
    const { refresh, setShowCommentModal } = await openSheet();
    expect(document.activeElement, "the comment box is not focused on open").toBe(commentBox());
    expect(submit().disabled, "submit is on with nothing filled").toBe(true);
    fireEvent.change(commentBox(), { target: { value: "Nice" } });
    expect(submit().disabled, "submit is on without stars").toBe(true);
    fireEvent.click(screen.getByText("4 stars"));
    fireEvent.click(screen.getByText("add photo"));
    expect(submit().disabled, "submit is off with stars and a comment").toBe(false);

    fireEvent.click(submit());
    await waitFor(() => expect(refresh, "the list was not refreshed").toHaveBeenCalled());
    expect(order.RateOrderWithhComment, "the rating body is wrong").toHaveBeenCalledWith({
      comment: "Nice",
      star_rating: 4,
      order_detail_id: 50,
      productId: 5,
      id: null,
      variant: "Red-M",
      owner_id: 3,
      owner_type: "shop",
      images: ["new.webp"],
    });
    expect(trackOrderMgmt, "the rating was not tracked").toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ star_rating: 4, has_comment: true, image_count: 1, is_edit: false }),
    );
    expect(routerSpies.refresh, "the page was not refreshed").toHaveBeenCalled();
    expect(setShowCommentModal, "the sheet was not closed").toHaveBeenCalledWith(false);
  });

  it("submits with Enter once stars and a comment are set", async () => {
    await openSheet({ initialRating: 3 });
    fireEvent.keyDown(commentBox(), { key: "Enter" });
    expect(order.RateOrderWithhComment, "Enter without a comment sent a rating").not.toHaveBeenCalled();
    fireEvent.change(commentBox(), { target: { value: "Good" } });
    fireEvent.keyDown(commentBox(), { key: "a" });
    expect(order.RateOrderWithhComment, "a letter key sent the rating").not.toHaveBeenCalled();
    fireEvent.keyDown(commentBox(), { key: "Enter" });
    await waitFor(() =>
      expect(order.RateOrderWithhComment, "Enter did not send the rating").toHaveBeenCalledWith(
        expect.objectContaining({ star_rating: 3, comment: "Good" }),
      ),
    );
  });

  it("keeps the sheet open and logs when the market backend refuses", async () => {
    order.RateOrderWithhComment.mockRejectedValue(new Error("refused"));
    const { setShowCommentModal } = await openSheet({ initialRating: 5 });
    fireEvent.change(commentBox(), { target: { value: "Nice" } });
    fireEvent.click(submit());
    await waitFor(() => expect(logError, "the refusal was not logged").toHaveBeenCalled());
    expect(setShowCommentModal, "a refused rating closed the sheet").not.toHaveBeenCalled();
    expect(submit().disabled, "submit stayed off after the refusal").toBe(false);
  });

  it("edits an earlier rating: Update is off until something changes", async () => {
    await openSheet({
      isRated: true,
      initialRating: 4,
      lastRatingId: 99,
      lastComment: "Old",
      comments_images_customer: ["a.webp"],
    });
    expect(commentBox().value, "the earlier comment is not shown").toBe("Old");
    expect(submit().disabled, "Update is on with nothing changed").toBe(true);
    fireEvent.click(screen.getByText("remove first"));
    expect(screen.getByTestId("photos").dataset.images, "the photo was not removed").toBe("");
    expect(submit().disabled, "Update is off after a change").toBe(false);
    fireEvent.click(submit());
    await waitFor(() =>
      expect(order.RateOrderWithhComment, "the edit did not carry the rating id").toHaveBeenCalledWith(
        expect.objectContaining({ id: 99, images: [] }),
      ),
    );
  });

  it("closes from Cancel and the backdrop, but not while sending", async () => {
    const { setShowCommentModal } = await openSheet({ initialRating: 2 });
    fireEvent.click(screen.getByText("Cancel"));
    expect(setShowCommentModal, "Cancel did not close").toHaveBeenCalledWith(false);
    fireEvent.click(document.querySelector(".fixed.inset-0") as HTMLElement);
    expect(setShowCommentModal, "the backdrop did not close").toHaveBeenCalledTimes(2);
  });

  it("does not close or change stars while a rating is being sent", async () => {
    const { setShowCommentModal } = await openSheet({ startLoading: true });
    fireEvent.click(document.querySelector(".fixed.inset-0") as HTMLElement);
    expect(setShowCommentModal, "the sheet closed while sending").not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("4 stars"));
    expect(screen.getByTestId("stars").dataset.rating, "stars changed while sending").toBe("0");
  });
});
