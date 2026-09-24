// The search box over the chat list (components/Chat/components/ChatListSearch.tsx):
// it filters at once and asks the chat backend for contacts after a pause.
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ searchContact: vi.fn() }));

vi.mock("store/chat/actions", () => ({ SearchContact: (...a: any[]) => h.searchContact(...a) }));

import ChatListSearch from "components/Chat/components/ChatListSearch";

afterEach(() => {
  vi.useRealTimers();
  h.searchContact.mockClear();
});

describe("ChatListSearch", () => {
  it("filters the list at once and searches contacts after half a second", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const setSearch = vi.fn();
    await renderWithProviders(<ChatListSearch search="" setSearch={setSearch} />);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "al<i>" } });
    expect(setSearch, "the list filter did not get the cleaned text").toHaveBeenCalledWith("ali");
    expect(h.searchContact, "the contact search did not wait").not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(h.searchContact, "the contact search did not run after the pause").toHaveBeenCalledWith("ali");
    expect(screen.getByPlaceholderText("Search, Chat, Contact, Start New Chat"), "the hint was not shown").toBeInTheDocument();
  });
});
