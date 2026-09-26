// The body of a deleted message (components/Chat/components/messages/DeletedMessage.tsx).
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../render";

const h = vi.hoisted(() => ({ photoUser: undefined as any }));

vi.mock("components/Chat/components/ChatPhoto", () => ({
  default: (p: any) => {
    h.photoUser = p.user;
    return <div data-testid="photo" />;
  },
}));

import DeletedMessage from "components/Chat/components/messages/DeletedMessage";
import ChatMessage from "components/Chat/components/ChatMessage";

const ME = 1;
const THEM = 2;
const activeChat = {
  id: 7,
  channel_members: [
    { user_id: ME, user: { name: "Me" } },
    { user_id: THEM, user: { name: "Them", photo_path: "/them.png" } },
  ],
};

describe("DeletedMessage", () => {
  it("says the message was deleted, with an avatar on the first bubble", async () => {
    await renderWithProviders(<DeletedMessage type="first-chat" activeChat={activeChat} sender_user_id={ME} />, {
      store: { userChat: { id: ME }, activeChat },
    });
    expect(screen.getByText("This Message Was Deleted"), "the deleted label was not shown").toBeInTheDocument();
    expect(document.querySelector(".absolute-avatar")!.className, "a member with a name and no photo got no text avatar").toContain("text-avatar");
  });

  it("shows no avatar in the middle of a run", async () => {
    await renderWithProviders(<DeletedMessage type="middle-chat" activeChat={activeChat} sender_user_id={ME} />, {
      store: { userChat: { id: ME }, activeChat },
    });
    expect(screen.queryByTestId("photo"), "a middle bubble showed an avatar").toBeNull();
  });

  it("BUG-chat-14: a deleted message from the other person shows their avatar", async () => {
    await renderWithProviders(
      <ChatMessage
        isPrivate={null}
        setVid={vi.fn()}
        setImg={vi.fn()}
        GetMessage={vi.fn()}
        type="lonely"
        message_content={{ content: "" } as any}
        message_files={[]}
        message_type={{ name: "TextMessage", event_name: "", created_at: null }}
        message_status={[]}
        mid={null as any}
        id={5}
        created_at="2030-01-15T08:05:00"
        auth_message_status={{ is_deleted: 1 } as any}
        is_forward={0}
        sender_user_id={THEM}
        parent_message={null as any}
        parent_message_id={null as any}
        duration_in_seconds={null}
      />,
      { store: { userChat: { id: ME }, activeChat } },
    );
    expect(h.photoUser?.name, "the other person's deleted message showed my avatar").toBe("Them");
  });
});
