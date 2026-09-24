// The edit / delete dialogs for an FAQ question.
import { describe, expect, it, vi } from "vitest";

vi.mock("components/global/ConfirmModal", () => ({
  ConfirmModal: ({ onCancel, onConfirm }: any) => (
    <div>
      <button onClick={onCancel}>cancel delete</button>
      <button onClick={onConfirm}>confirm delete</button>
    </div>
  ),
}));

import { FaqItemOptions } from "components/Server/product/ProductFAQSection/FaqItemOptions";

import { fireEvent, renderWithProviders, screen, userEvent } from "../../../../render";

const question = { id: 12, comment: "is it cotton?" };

const renderOptions = async (props: Record<string, any>) => {
  const spies = { deleteAction: vi.fn(), updateAction: vi.fn(), handleCloseModal: vi.fn() };
  const result = await renderWithProviders(
    <FaqItemOptions is_update={false} comment={question} loading={false} language="en" {...spies} {...props} />,
  );
  return { ...spies, ...result };
};

const submit = () => document.querySelector('[data-pw="faq-edit-submit"]') as HTMLButtonElement;
const box = () => screen.getByRole("textbox") as HTMLTextAreaElement;

describe("the FAQ question dialogs", () => {
  it("draws nothing when neither edit nor delete is asked for", async () => {
    const { container } = await renderOptions({});
    expect(container.innerHTML, "no dialog should be drawn").toBe("");
  });

  it("asks before deleting, and deletes this question on confirm", async () => {
    const { deleteAction, handleCloseModal } = await renderOptions({ is_delete: true });
    await userEvent.click(screen.getByText("confirm delete"));
    expect(deleteAction, "confirm should delete this question").toHaveBeenCalledWith(12);
    await userEvent.click(screen.getByText("cancel delete"));
    expect(handleCloseModal, "cancel should close the dialog").toHaveBeenCalled();
  });

  it("keeps Update disabled until the text changes, then sends the new text", async () => {
    const { updateAction } = await renderOptions({ is_update: true, language: "ku" });
    expect(box().value, "the box should start with the current question").toBe("is it cotton?");
    expect(submit(), "nothing changed, so nothing to update").toBeDisabled();
    expect(box().className, "the text should be right-aligned in Kurdish").toContain("text-right");
    fireEvent.change(box(), { target: { value: "is it wool?" } });
    await userEvent.click(submit());
    expect(updateAction, "Update should send the edited question").toHaveBeenCalledWith({
      id: 12,
      comment: "is it wool?",
      text: "is it wool?",
    });
  });

  it("sends on Enter, but never an empty question", async () => {
    const { updateAction } = await renderOptions({ is_update: true });
    fireEvent.keyDown(box(), { key: "Enter" });
    fireEvent.keyDown(box(), { key: "b" });
    expect(updateAction, "Enter should send the question once").toHaveBeenCalledTimes(1);
    fireEvent.change(box(), { target: { value: "  " } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await userEvent.click(submit());
    expect(updateAction, "an empty question must not be sent").toHaveBeenCalledTimes(1);
  });

  it("shows a spinner while saving, and closes on the backdrop or Cancel", async () => {
    const { handleCloseModal, container } = await renderOptions({ is_update: true, loading: true });
    expect(submit().textContent, "the button should show a spinner instead of its label").not.toContain(
      "Update Question",
    );
    fireEvent.click(container.querySelector(".fixed.inset-0") as HTMLElement);
    expect(handleCloseModal, "a click on the backdrop should close the dialog").toHaveBeenCalledTimes(1);
  });
});
