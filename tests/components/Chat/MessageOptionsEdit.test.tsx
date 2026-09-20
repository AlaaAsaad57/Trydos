// The hover menu on a text message keeps its "Edit" option.
//
// WHAT BROKE
// `components/Chat/components/OptionsMenu.tsx` shows two of its options only
// for a text message:
//
//   Copy  -> props.message?.message_type?.name === "TextMessage"
//   Edit  -> props.isSender && props.message?.message_type?.name === "TextMessage"
//
// The chat refactor in aca3b87a ("pass less data to message components") split
// one big ChatMessage into one component per message type. Every other type —
// ImageMessage, VideoMessage, FileMessage, AudioMessage, ProductMessage — kept
// `message_type` in the object it hands to OptionsMenu. TextMessage did not.
// So on the one message type those two options are written for, both conditions
// read `undefined` and neither option is drawn. Edit and Copy vanished from the
// menu while still sitting in the source.
//
// The same refactor also lost the sender check. Before it, ChatMessage had two
// separate branches and passed `isSender={true}` for my own messages and
// `isSender={false}` for the other person's. The shared TextMessage hardcoded
// `true`, so Edit would appear on a message I did not send — and do nothing
// there, because the edit box itself is gated on the real sender.
//
// WHAT THESE TESTS HOLD TO
//   1. my own text message offers Edit
//   2. my own text message offers Copy (same missing field, same cause)
//   3. the other person's text message does not offer Edit
import { describe, expect, it, vi } from "vitest";
import React from "react";

import { renderWithProviders, screen } from "../../render";

import TextMessage from "components/Chat/components/messages/Types/TextMessage";

/** The signed-in chat user, and the person on the other side. */
const ME = 501;
const THEM = 502;

/** The conversation ChatMessage reads members out of. */
const activeChat = {
  id: 9001,
  channel_members: [
    { user_id: ME, user: { id: ME, name: "Me", photo_path: "/me.png" } },
    { user_id: THEM, user: { id: THEM, name: "Them", photo_path: "/them.png" } },
  ],
};

/**
 * Render one text message with its hover menu open.
 *
 * `mine` decides who sent it — the same choice ChatMessage makes when it works
 * out `isSentByMe` and hands it down as `is_from_sender`.
 */
async function renderTextMessage(mine: boolean) {
  return renderWithProviders(
    <TextMessage
      key={1}
      sender_user_id={mine ? ME : THEM}
      is_from_sender={mine}
      DeleteModal={false}
      GetMessage={vi.fn()}
      created_at="2030-01-01T00:00:00.000Z"
      id={77}
      isPrivate={false}
      is_forward={0}
      message_content={{ content: "hello there" }}
      message_status={[]}
      openMenu={true}
      mid={null}
      parent_message={null}
      parent_message_id={null}
      setDelete={vi.fn()}
      setOpen={vi.fn()}
      type="lonely"
      channel_id={activeChat.id}
      channel_member={activeChat.channel_members[mine ? 0 : 1].user}
    />,
    { store: { userChat: { id: ME }, activeChat } },
  );
}

describe("the hover menu on a text message", () => {
  it("offers Edit on a message I sent", async () => {
    await renderTextMessage(true);

    expect(
      screen.queryByText("Edit"),
      "the options menu on my own text message has no Edit option — " +
        "OptionsMenu only draws it when the message it is given carries " +
        'message_type.name === "TextMessage"',
    ).toBeInTheDocument();
  });

  it("offers Copy on a message I sent", async () => {
    await renderTextMessage(true);

    expect(
      screen.queryByText("Copy"),
      "the options menu on my own text message has no Copy option — " +
        "Copy is gated on the same message_type field as Edit",
    ).toBeInTheDocument();
  });

  it("does not offer Edit on a message the other person sent", async () => {
    await renderTextMessage(false);

    expect(
      screen.queryByText("Edit"),
      "the options menu offers Edit on a message I did not send — " +
        "nobody may edit another person's message, and the edit box behind " +
        "the option refuses to open for it anyway",
    ).not.toBeInTheDocument();
  });
});


