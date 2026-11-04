import { describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import NewChatSheet from "components/DemoApp1/chat/NewChatSheet";

// The new contact form has the old form's country code picker (the owner's
// choice, 2026-11-04). The contact is saved with the full number: the code and
// the local number, as the old form built it (`phoneWithDialCode`).

const el = (pw: string) => {
  const found = document.querySelector<HTMLElement>(`[data-pw="${pw}"]`);
  if (!found) throw new Error(`the sheet shows no element with data-pw "${pw}"`);
  return found;
};

async function openForm() {
  const onAdd = vi.fn();
  render(<NewChatSheet open contacts={[]} onPick={vi.fn()} onAdd={onAdd} onClose={vi.fn()} t={(k: string) => k} />);
  await act(async () => {
    fireEvent.click(el("demo-new-chat-add"));
  });
  // The form comes in after the list's exit animation.
  await vi.waitFor(() => el("demo-new-contact-name"), { timeout: 3000 });
  return onAdd;
}

describe("the new contact form's country code", () => {
  it("starts on Syria (+963), as the old form, and saves the number with it", async () => {
    const onAdd = await openForm();
    expect((el("demo-new-contact-dial") as HTMLSelectElement).value, "the code does not start on +963").toBe("+963");
    fireEvent.change(el("demo-new-contact-name"), { target: { value: "Friend" } });
    fireEvent.change(el("demo-new-contact-phone"), { target: { value: "0944 123 456" } });
    fireEvent.click(el("demo-new-contact-save"));
    expect(onAdd, "the contact was not saved with the Syrian code and the local number").toHaveBeenCalledWith(
      "Friend",
      "963944123456",
    );
  });

  it("saves with the code the shopper picked", async () => {
    const onAdd = await openForm();
    fireEvent.change(el("demo-new-contact-dial"), { target: { value: "+90" } });
    fireEvent.change(el("demo-new-contact-name"), { target: { value: "Ayse" } });
    fireEvent.change(el("demo-new-contact-phone"), { target: { value: "5528002000" } });
    fireEvent.click(el("demo-new-contact-save"));
    expect(onAdd, "the contact was not saved with the picked Turkish code").toHaveBeenCalledWith("Ayse", "905528002000");
  });

  it("does not save with no number", async () => {
    const onAdd = await openForm();
    fireEvent.change(el("demo-new-contact-name"), { target: { value: "Friend" } });
    fireEvent.click(el("demo-new-contact-save"));
    expect(onAdd, "a contact with no number was saved").not.toHaveBeenCalled();
  });
});
