// The edit / delete dialogs for a buyer's rating comment.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/global/ConfirmModal", () => ({
  ConfirmModal: ({ onCancel, onConfirm, confirmTilte }: any) => (
    <div role="dialog" aria-label={confirmTilte}>
      <button onClick={onCancel}>cancel delete</button>
      <button onClick={onConfirm}>confirm delete</button>
    </div>
  ),
}));
vi.mock("components/settings/cards/RatingStars", () => ({
  default: ({ onRatingChange }: any) => (
    <button onClick={() => onRatingChange?.(5)}>five stars</button>
  ),
}));
vi.mock("components/Orders/UploadImageComponent", () => ({
  default: ({ images, removeImageAction }: any) => (
    <div>
      {images.map((img: string) => (
        <button key={img} onClick={() => removeImageAction(img)}>
          remove {img}
        </button>
      ))}
    </div>
  ),
}));

import { RatingCommentOptions } from "components/Server/product/ProductBuyersComment/RatingCommentOptions";

import { fireEvent, renderWithProviders, screen, userEvent } from "../../../../render";

const comment = {
  id: 8,
  comment: "good shoe",
  star_rating: 3,
  comments_images_customer: ["a.png"],
};

const renderOptions = (props: Record<string, any>) => {
  const spies = {
    deleteAction: vi.fn(),
    updateAction: vi.fn(),
    handleCloseModal: vi.fn(),
  };
  const result = renderWithProviders(
    <RatingCommentOptions
      is_update={false}
      comment={comment}
      loading={false}
      language="en"
      {...spies}
      {...props}
    />,
  );
  return { ...spies, result };
};

const submit = () => screen.getByRole("button", { name: "Update Rating" });

describe("the rating comment dialogs", () => {
  it("draws nothing when neither edit nor delete is asked for", async () => {
    const { result } = renderOptions({});
    expect((await result).container.innerHTML, "no dialog should be drawn").toBe("");
  });

  it("asks before deleting, and deletes this comment on confirm", async () => {
    const { deleteAction, handleCloseModal, result } = renderOptions({ is_delete: true });
    await result;
    await userEvent.click(screen.getByText("confirm delete"));
    expect(deleteAction, "confirm should delete this comment").toHaveBeenCalledWith(8);
    await userEvent.click(screen.getByText("cancel delete"));
    expect(handleCloseModal, "cancel should close the dialog").toHaveBeenCalled();
  });

  it("keeps Update disabled until something changes", async () => {
    const { result } = renderOptions({ is_update: true });
    await result;
    expect(
      (screen.getByRole("textbox") as HTMLTextAreaElement).value,
      "the box should start with the current comment",
    ).toBe("good shoe");
    expect(submit(), "nothing changed, so nothing to update").toBeDisabled();
  });

  it("sends the new text, stars and remaining pictures on Update", async () => {
    const { updateAction, result } = renderOptions({ is_update: true, language: "ar" });
    await result;
    await userEvent.click(screen.getByText("five stars"));
    await userEvent.click(screen.getByText("remove a.png"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "great shoe" } });
    await userEvent.click(submit());
    expect(updateAction, "Update should send the edited comment").toHaveBeenCalledWith(
      expect.objectContaining({
        id: 8,
        comment: "great shoe",
        text: "great shoe",
        star_rating: 5,
        rating: 5,
        comments_images_customer: [],
      }),
    );
    expect(
      screen.getByRole("textbox").className,
      "the text should be right-aligned in Arabic",
    ).toContain("text-right");
  });

  it("sends the edit when Enter is pressed, but not with an empty text", async () => {
    const { updateAction, result } = renderOptions({ is_update: true });
    await result;
    const box = screen.getByRole("textbox");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(updateAction, "Enter should send the comment").toHaveBeenCalledTimes(1);
    fireEvent.keyDown(box, { key: "a" });
    fireEvent.change(box, { target: { value: "   " } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(updateAction, "an empty comment must not be sent").toHaveBeenCalledTimes(1);
  });

  it("sends nothing on Update when the text is empty", async () => {
    const { updateAction, result } = renderOptions({
      is_update: true,
      comment: { ...comment, comments_images_customer: undefined },
    });
    await result;
    fireEvent.change(screen.getByRole("textbox"), { target: { value: " " } });
    await userEvent.click(submit());
    expect(updateAction, "an empty comment must not be sent").not.toHaveBeenCalled();
  });

  it("locks the stars and shows a spinner while saving, and closes on the backdrop", async () => {
    const { handleCloseModal, result } = renderOptions({ is_update: true, loading: true });
    const { container } = await result;
    await userEvent.click(screen.getByText("five stars"));
    expect(
      screen.queryByRole("button", { name: "Update Rating" }),
      "the button should show a spinner instead of its label while saving",
    ).toBeNull();
    fireEvent.click(container.querySelector(".fixed.inset-0") as HTMLElement);
    expect(handleCloseModal, "a click on the backdrop should close the dialog").toHaveBeenCalled();
  });
});
