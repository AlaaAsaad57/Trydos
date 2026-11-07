import { describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import NewChatSheet from "components/DemoApp1/chat/NewChatSheet";

// The chat backend accepts a contact with the shopper's own number (201, with
// user_id = contact_user_id), so the form must refuse it (eb7a8849e).

const OWN = "963944123456";

const el = (pw: string) => {
  const found = document.querySelector<HTMLElement>(`[data-pw="${pw}"]`);
  if (!found) throw new Error(`the sheet shows no element with data-pw "${pw}"`);
  return found;
};
const has = (pw: string) => !!document.querySelector(`[data-pw="${pw}"]`);

async function fill(local: string) {
  const onAdd = vi.fn();
  render(
    <NewChatSheet open contacts={[]} ownPhone={OWN} onPick={vi.fn()} onAdd={onAdd} onClose={vi.fn()} t={(k: string) => k} />,
  );
  await act(async () => {
    fireEvent.click(el("demo-new-chat-add"));
  });
  await vi.waitFor(() => el("demo-new-contact-name"), { timeout: 3000 });
  fireEvent.change(el("demo-new-contact-name"), { target: { value: "Me Again" } });
  fireEvent.change(el("demo-new-contact-phone"), { target: { value: local } });
  return onAdd;
}

describe("the new contact form and the shopper's own number", () => {
  it("does not save the shopper's own number, typed with its trunk 0", async () => {
    const onAdd = await fill("0944 123 456");
    fireEvent.click(el("demo-new-contact-save"));
    expect(onAdd, "the form saved the shopper's own number as a contact").not.toHaveBeenCalled();
  });

  it("says why", async () => {
    await fill("0944 123 456");
    expect(el("demo-new-contact-own").textContent, "the form does not say this is the shopper's own number").toBe(
      "This is your own number",
    );
  });

  it("marks the save button as off", async () => {
    await fill("0944 123 456");
    expect(
      el("demo-new-contact-save").getAttribute("aria-disabled"),
      "the save button stays on for the own number",
    ).toBe("true");
  });

  it("saves another number, and says nothing", async () => {
    const onAdd = await fill("0944 123 457");
    expect(has("demo-new-contact-own"), "the form warned about a number that is not the shopper's").toBe(false);
    fireEvent.click(el("demo-new-contact-save"));
    expect(onAdd, "the form did not save another person's number").toHaveBeenCalledWith("Me Again", "963944123457");
  });
});
