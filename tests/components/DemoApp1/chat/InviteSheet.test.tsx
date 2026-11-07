import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import InviteSheet from "components/DemoApp1/chat/InviteSheet";

// The invite's choices on a computer: WhatsApp, Telegram and copy, as the old
// chat's invite modal.

const person = { id: "book-3", name: "Outside Friend", phone: "0937288307", initials: "OF", fullPhone: "963937288307" };

const el = (pw: string) => {
  const found = document.querySelector<HTMLElement>(`[data-pw="${pw}"]`);
  if (!found) throw new Error(`the sheet shows no element with data-pw "${pw}"`);
  return found;
};

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { clipboard?: unknown }).clipboard;
});

describe("the invite sheet", () => {
  it("names who is invited and asks how", () => {
    render(<InviteSheet contact={person} onClose={vi.fn()} onCopied={vi.fn()} />);
    const sheet = el("demo-invite-sheet").textContent;
    expect(sheet, "the sheet does not name the contact").toContain("Outside Friend");
    expect(sheet, "the sheet does not ask how to send the invite").toContain("Choose how to send the invitation");
  });

  it("WhatsApp opens the contact's chat in a new tab, and the sheet closes", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const onClose = vi.fn();
    render(<InviteSheet contact={person} onClose={onClose} onCopied={vi.fn()} />);
    fireEvent.click(el("demo-invite-whatsapp"));
    expect(String(open.mock.calls[0]?.[0]).startsWith("https://wa.me/"), "WhatsApp did not open").toBe(true);
    expect(onClose, "the sheet stayed up after WhatsApp").toHaveBeenCalled();
  });

  it("Telegram opens the contact's chat in a new tab, and the sheet closes", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const onClose = vi.fn();
    render(<InviteSheet contact={person} onClose={onClose} onCopied={vi.fn()} />);
    fireEvent.click(el("demo-invite-telegram"));
    expect(String(open.mock.calls[0]?.[0]).startsWith("https://t.me/"), "Telegram did not open").toBe(true);
    expect(onClose, "the sheet stayed up after Telegram").toHaveBeenCalled();
  });

  it("copy puts the invite on the clipboard and tells the screen", async () => {
    const writeText = vi.fn(async (_text: string) => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const onCopied = vi.fn();
    render(<InviteSheet contact={person} onClose={vi.fn()} onCopied={onCopied} />);
    await act(async () => {
      fireEvent.click(el("demo-invite-copy"));
    });
    expect(String(writeText.mock.calls[0]?.[0]), "the invite did not reach the clipboard").toContain(
      window.location.origin,
    );
    expect(onCopied, "the screen was not told the invite is copied").toHaveBeenCalled();
  });
});
