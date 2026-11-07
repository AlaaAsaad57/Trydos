import { describe, expect, it, vi } from "vitest";
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import NewChatSheet from "components/DemoApp1/chat/NewChatSheet";

// A phone-book contact who is not on Trydos has no chat: the old chat list
// offered an invite instead.

const person = { id: "book-3", name: "Outside Friend", phone: "0937288307", initials: "OF", fullPhone: "963937288307" };

const el = (pw: string) => {
  const found = document.querySelector<HTMLElement>(`[data-pw="${pw}"]`);
  if (!found) throw new Error(`the sheet shows no element with data-pw "${pw}"`);
  return found;
};

const sheet = (onInvite = vi.fn(), onPick = vi.fn()) =>
  render(
    <NewChatSheet
      open
      contacts={[]}
      invites={[person]}
      onInvite={onInvite}
      onPick={onPick}
      onAdd={vi.fn()}
      onClose={vi.fn()}
      t={(k: string) => k}
    />,
  );

describe("the New chat sheet and people who are not on Trydos", () => {
  it("lists them with the word Invite", () => {
    sheet();
    const row = el("demo-new-chat-invite-book-3");
    expect(row.textContent, "the row does not name the contact").toContain("Outside Friend");
    expect(row.textContent, "the row does not offer the invite").toContain("Invite");
  });

  it("a tap invites them, and opens no chat", () => {
    const onInvite = vi.fn();
    const onPick = vi.fn();
    sheet(onInvite, onPick);
    fireEvent.click(el("demo-new-chat-invite-book-3"));
    expect(onInvite, "a tap did not invite the contact").toHaveBeenCalledWith(person);
    expect(onPick, "a tap tried to open a chat with someone who is not on Trydos").not.toHaveBeenCalled();
  });
});
