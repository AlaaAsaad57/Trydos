// The call log row: does it name the right call?
//
// One row in the "Calls" tab comes from /api/v1/channels/my_calls. The row has
// to say two things, and both come from the same record:
//
//   direction  — who started it. `sender_user_id` against the signed-in chat
//                user. Only a call somebody else started, and nobody answered,
//                is a missed call.
//   media      — voice or video. `message_type.name` is "VoiceCall" or
//                "VideoCall".
//
// `duration_in_seconds` is 0 for every call that never connected, whichever
// side started it — so duration alone can never tell direction.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import React from "react";

import CallItem from "components/Chat/components/CallItem";

import { renderWithProviders } from "../../render";

/** The signed-in chat user in these tests. Matches the sender in the sample. */
const ME = 657;
/** The person on the other end. */
const THEM = 672;

/**
 * Render one row the way CallList does — the same prop shape, so the test
 * breaks if the row stops being handed what it needs.
 */
async function renderCallRow({
  sender,
  duration,
  messageType,
}: {
  sender: number;
  duration: number;
  messageType: "VoiceCall" | "VideoCall";
}) {
  return renderWithProviders(
    <CallItem
      photo="customers/profile/test.jpg"
      name="Alaa Test123"
      date="15/09"
      duration={duration}
      Delete={() => {}}
      type={{ type: messageType, sender, duration }}
    />,
    { store: { userChat: { id: ME } } },
  );
}

describe("CallItem — the call log row", () => {
  it("does not call an outgoing voice call a missed call", async () => {
    await renderCallRow({ sender: ME, duration: 0, messageType: "VoiceCall" });

    expect(
      screen.queryByText(/Missed/i),
      "a call this user started was labelled as missed; only a call from the other side that nobody answered is missed",
    ).not.toBeInTheDocument();
  });

  it("names an outgoing voice call by direction and media", async () => {
    await renderCallRow({ sender: ME, duration: 0, messageType: "VoiceCall" });

    expect(
      screen.getByText("Outgoing Voice Call"),
      "the row did not say the call was outgoing and was a voice call",
    ).toBeInTheDocument();
  });

  it("names an outgoing video call by direction and media", async () => {
    await renderCallRow({ sender: ME, duration: 0, messageType: "VideoCall" });

    expect(
      screen.getByText("Outgoing Video Call"),
      "the row did not say the call was outgoing and was a video call",
    ).toBeInTheDocument();
  });

  it("names an answered incoming voice call", async () => {
    await renderCallRow({ sender: THEM, duration: 42, messageType: "VoiceCall" });

    expect(
      screen.getByText("Incoming Voice Call"),
      "an answered call from the other side was not labelled as an incoming voice call",
    ).toBeInTheDocument();
  });

  it("names an answered incoming video call", async () => {
    await renderCallRow({ sender: THEM, duration: 42, messageType: "VideoCall" });

    expect(
      screen.getByText("Incoming Video Call"),
      "an answered call from the other side was not labelled as an incoming video call",
    ).toBeInTheDocument();
  });

  it("says which media a missed call used", async () => {
    await renderCallRow({ sender: THEM, duration: 0, messageType: "VideoCall" });

    expect(
      screen.getByText("Missed Video Call"),
      "a call from the other side that nobody answered did not say it was a video call",
    ).toBeInTheDocument();
  });

  it("shows a camera icon for a video call, not a handset", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VideoCall",
    });
    const icon = container.querySelector(".call-type img");

    expect(
      icon?.getAttribute("src"),
      `the video row showed "${icon?.getAttribute("src")}"; a video call has to be told apart from a voice call at a glance, not only by its label`,
    ).toBe("/icons/chat/outgoingVideoCall.svg");
  });

  it("keeps the handset icon for a voice call", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VoiceCall",
    });
    const icon = container.querySelector(".call-type img");

    expect(
      icon?.getAttribute("src"),
      `the voice row showed "${icon?.getAttribute("src")}" instead of the outgoing handset icon`,
    ).toBe("/icons/chat/outgoingCall.svg");
  });

  it("gives each direction its own video icon", async () => {
    const incoming = await renderCallRow({
      sender: THEM,
      duration: 42,
      messageType: "VideoCall",
    });
    expect(
      incoming.container
        .querySelector(".call-type img")
        ?.getAttribute("src"),
      "an answered incoming video call did not get the incoming video icon",
    ).toBe("/icons/chat/IncomingVideoCall.svg");

    const missed = await renderCallRow({
      sender: THEM,
      duration: 0,
      messageType: "VideoCall",
    });
    expect(
      missed.container.querySelector(".call-type img")?.getAttribute("src"),
      "a video call nobody answered did not get the missed video icon",
    ).toBe("/icons/chat/missedVideoCall.svg");
  });

  it("marks the row with the direction the stylesheet colours", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VoiceCall",
    });
    const row = container.querySelector(".call-conversation-item");

    expect(
      row?.className,
      `the row class was "${row?.className}"; chatcomponent.css colours the row through .missed / .incoming / .outgoing, so an outgoing row must carry "outgoing"`,
    ).toContain("outgoing");
  });

  it("never writes an object into the row class", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VoiceCall",
    });
    const row = container.querySelector(".call-conversation-item");

    expect(
      row?.className,
      "the row class was built from an object, so it reads [object Object] and matches no stylesheet rule",
    ).not.toContain("[object Object]");
  });
});

describe("CallItem — deleting a row", () => {
  it("deletes the call from the log when its bin is pressed", async () => {
    const Delete = vi.fn();
    await renderWithProviders(
      <CallItem
        photo="customers/profile/test.jpg"
        name="Alaa Test123"
        date="15/09"
        duration={65}
        Delete={Delete}
        type={{ type: "VoiceCall", sender: THEM, duration: 65 }}
      />,
      { store: { userChat: { id: ME } } },
    );
    fireEvent.click(document.querySelector(".options-icon")!);
    expect(Delete, "the bin did not delete the call").toHaveBeenCalled();
  });
});

// BUG-C-74. In Arabic and Kurdish the chats tab mirrors its rows (ChatItem:
// `flex-row-reverse` on the row and `dir-rtl` on the name block, keyed on the
// store `language`). The calls tab has to do the same: the photo on the right,
// the name and the call type next to it and right-aligned, the date and the
// delete bin on the left. English and Turkish stay left to right.
describe("CallItem — right-to-left languages", () => {
  async function renderIn(language: "en" | "ar" | "tr" | "ku") {
    const r = await renderWithProviders(
      <CallItem
        photo="customers/profile/test.jpg"
        name="Alaa Test123"
        date="15/09"
        duration={65}
        Delete={() => {}}
        type={{ type: "VoiceCall", sender: THEM, duration: 65 }}
      />,
      { language, store: { userChat: { id: ME } } },
    );
    const q = (sel: string) =>
      r.container.querySelector(sel) as HTMLElement | null;
    return {
      row: q(".call-conversation-item"),
      info: q(".call-info"),
      date: q(".call-date"),
      bin: q(".options-icon"),
    };
  }

  for (const language of ["ar", "ku"] as const) {
    it(`mirrors the call row in ${language}, the same way the chats tab does`, async () => {
      const { row, info, date, bin } = await renderIn(language);

      expect(
        row?.className,
        `in ${language} the call row did not reverse, so the photo stayed on the left (class "${row?.className}")`,
      ).toContain("flex-row-reverse");
      expect(
        info?.className,
        `in ${language} the name and call type were not set right to left (class "${info?.className}")`,
      ).toContain("dir-rtl");
      expect(
        date?.className,
        `in ${language} the date did not move to the left side (class "${date?.className}")`,
      ).toContain("left-[25px]");
      expect(
        bin?.className,
        `in ${language} the delete bin did not move to the left side (class "${bin?.className}")`,
      ).toContain("left-[10px]");
    });
  }

  for (const language of ["en", "tr"] as const) {
    it(`keeps the call row left to right in ${language}`, async () => {
      const { row, info, date } = await renderIn(language);

      expect(
        row?.className,
        `in ${language} the call row was reversed, but ${language} reads left to right`,
      ).not.toContain("flex-row-reverse");
      expect(
        info?.className,
        `in ${language} the name and call type were set right to left`,
      ).not.toContain("dir-rtl");
      expect(
        date?.className,
        `in ${language} the date moved to the left side`,
      ).not.toContain("left-[25px]");
    });
  }
});

// A shopper deletes a call to hide who they talked to and when. The row still
// has to read as a call row: a grey tile with a crossed-out phone where the
// picture was, "Deleted Call", and a line that says why nothing else shows.
describe("CallItem — a deleted call", () => {
  async function renderDeleted(language: "en" | "ar" | "tr" | "ku" = "en") {
    const r = await renderWithProviders(<CallItem deleted />, {
      language,
      store: { userChat: { id: ME } },
    });
    return {
      row: r.container.querySelector(".call-conversation-item") as HTMLElement | null,
      tile: r.container.querySelector(".deleted-call-icon") as HTMLElement | null,
      info: r.container.querySelector(".call-info") as HTMLElement | null,
    };
  }

  it("says it was deleted and that the call details are hidden", async () => {
    await renderDeleted();
    expect(screen.queryByText("Deleted Call"), "the row did not say the call was deleted").toBeInTheDocument();
    expect(
      screen.queryByText("Call Details Are Hidden"),
      "the row did not say why it shows no name, picture or date",
    ).toBeInTheDocument();
  });

  it("puts a crossed-out phone tile where the picture was, and no picture", async () => {
    const { row, tile } = await renderDeleted();
    expect(tile, "the deleted call has no tile in the picture's place, so the row does not line up").not.toBeNull();
    expect(tile!.querySelector("svg"), "the tile in the picture's place has no phone icon").not.toBeNull();
    expect(row!.querySelector("img"), "the deleted call shows a picture").toBeNull();
  });

  for (const language of ["ar", "ku"] as const) {
    it(`mirrors the deleted call row in ${language}`, async () => {
      const { row, info } = await renderDeleted(language);
      expect(
        row?.className,
        `in ${language} the deleted call row did not reverse, so the tile stayed on the left (class "${row?.className}")`,
      ).toContain("flex-row-reverse");
      expect(
        info?.className,
        `in ${language} the deleted call text was not set right to left (class "${info?.className}")`,
      ).toContain("dir-rtl");
    });
  }
});
