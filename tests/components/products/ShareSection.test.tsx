// The share panel on a product. A shopper signed in to chat gets their chat
// contacts loaded (chat backend) so they can share to them; a guest does not.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShareSection from "components/products/ShareSection";

import { renderWithProviders, screen, waitFor } from "../../render";

const { chat } = vi.hoisted(() => ({
  chat: { getContacts: vi.fn(), getChats: vi.fn() },
}));
vi.mock("services/chat", () => ({ default: chat }));
vi.mock("components/products/ShareOptions", () => ({
  default: () => <div data-testid="share-options" />,
}));

describe("ShareSection", () => {
  beforeEach(() => {
    chat.getContacts.mockReset();
    chat.getChats.mockReset();
  });

  it("loads the chat contacts and chats for a chat user, with a spinner meanwhile", async () => {
    let finish: () => void = () => {};
    chat.getContacts.mockReturnValue(new Promise<void>((r) => (finish = r)));
    chat.getChats.mockResolvedValue(undefined);
    const { container } = await renderWithProviders(<ShareSection product={{ id: 1 }} />, {
      store: { userChat: { id: 5 } },
    });
    expect(screen.getByText("Share This Product With"), "the title is missing").toBeInTheDocument();
    expect(chat.getChats, "the chats were not loaded without the read flag").toHaveBeenCalledWith(false);
    expect(container.querySelector(".share-bar-top > div"), "no spinner while contacts load").not.toBeNull();
    finish();
    await waitFor(() =>
      expect(container.querySelector(".share-bar-top > div"), "the spinner stayed after loading").toBeNull(),
    );
    expect(screen.getByTestId("share-options"), "the share options are missing").toBeInTheDocument();
  });

  it("does not ask the chat backend for a guest", async () => {
    await renderWithProviders(<ShareSection product={{ id: 1 }} />, { store: { userChat: null } });
    expect(chat.getContacts, "a guest's contacts were asked for").not.toHaveBeenCalled();
  });
});
