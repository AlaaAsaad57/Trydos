// The row whose options menu is open is lifted above the rows after it.
//
// WHAT BROKE
// Each option in the hover menu carries a label (`.rep-descs`). The label is
// placed 45px BELOW the menu — outside the message row that owns it. Rows are
// plain siblings in the scroll list: `.message-container` is `position:
// relative` with no z-index (public/styles/ChatWindow.css), so the browser
// paints them in document order and every later row paints over the label.
// The label was on the page and visible, and still unreadable.
//
// HOW THAT WAS CONFIRMED
// The two rows were rendered in Chromium with the app's own stylesheets, the
// Edit option was hovered, and `document.elementFromPoint` was asked what sits
// at the centre of the label. The answer was the NEXT row's bubble:
//   topElementAtTooltip: "DIV.message-element-body message-body text-body lonely"
//   ownerRow:            "main-container-2"
// After the fix the same probe answers the label itself, inside row 1.
//
// WHY THE CHECK BELOW IS THE Z-INDEX AND NOT THE PAINT
// jsdom has no layout and no painting, so it cannot answer "what covers what".
// What it can prove is the wiring the browser result depends on: the row that
// holds the open menu asks for a stacking level, and the others do not. The
// paint itself was proved in the browser, by hand, as recorded above.
//
// WHY NOT A BIG NUMBER
// The row only has to beat its own siblings, which are all at the default
// level. The scroll list clips the row, so a raised row cannot climb over the
// chat header or the input bar. A small number keeps it that way.
import { describe, expect, it, vi } from "vitest";
import React from "react";

import { fireEvent, renderWithProviders } from "../../render";

import SentMessage from "components/Chat/components/messages/SentMessage";
import ReceivedMessage from "components/Chat/components/messages/ReceivedMessage";

const ROW_ID = 41;

/** The row element ChatMessage gives every message, whichever side sent it. */
const row = () => document.getElementById(`main-container-${ROW_ID}`)!;

/** The level a row sits at when it asks for nothing: the browser default. */
const DEFAULT_LEVEL = "";

async function renderSent(isMenuOpen: boolean) {
  return renderWithProviders(
    <SentMessage
      id={ROW_ID}
      closeMenu={vi.fn()}
      isMenuOpen={isMenuOpen}
      created_at="2030-01-01T00:00:00.000Z"
      message_status={[]}
      message_type={{ name: "TextMessage" }}
    >
      <div>a message I sent</div>
    </SentMessage>,
  );
}

async function renderReceived(isMenuOpen: boolean) {
  return renderWithProviders(
    <ReceivedMessage
      id={ROW_ID}
      closeMenu={vi.fn()}
      isMenuOpen={isMenuOpen}
      message_type={{ name: "TextMessage" }}
      parent_message={null}
      isLonely={true}
      channel_member={null}
      isDeleted={false}
      onClick={vi.fn()}
      sender_message_id={99}
    >
      <div>a message I was sent</div>
    </ReceivedMessage>,
  );
}

describe("a message row while its options menu is open", () => {
  it("is raised above the rows after it, on my own message", async () => {
    await renderSent(true);

    expect(
      row().style.zIndex,
      "the row holding the open menu stays at the default stacking level, so " +
        "the next message paints over the option labels that hang below it",
    ).not.toBe(DEFAULT_LEVEL);
  });

  it("is raised above the rows after it, on the other person's message", async () => {
    await renderReceived(true);

    expect(
      row().style.zIndex,
      "the received row holding the open menu stays at the default stacking " +
        "level, so the next message paints over its option labels",
    ).not.toBe(DEFAULT_LEVEL);
  });

  it("goes back down once the menu is closed, on my own message", async () => {
    await renderSent(false);

    expect(
      row().style.zIndex,
      "a row with no open menu is still raised — every row would then be " +
        "raised, which puts them back in document order and fixes nothing",
    ).toBe(DEFAULT_LEVEL);
  });

  it("goes back down once the menu is closed, on the other person's message", async () => {
    await renderReceived(false);

    expect(
      row().style.zIndex,
      "a received row with no open menu is still raised — every row would " +
        "then be raised, which fixes nothing",
    ).toBe(DEFAULT_LEVEL);
  });

  it("is raised by a small number, not a huge one", async () => {
    await renderSent(true);

    const level = Number(row().style.zIndex);
    expect(
      level >= 1 && level <= 10,
      `the open row asks for level "${row().style.zIndex}". It has to be at ` +
        "least 1 to beat its siblings, which sit at the default. A large " +
        "number is a promise to climb over the chat header and the input bar " +
        "the day one of them stops making its own stacking context",
    ).toBe(true);
  });
});

describe("a message row — leaving it closes the menu", () => {
  it("closes the menu when the pointer leaves my own row and the other person's row", async () => {
    const closeSent = vi.fn();
    const closeReceived = vi.fn();
    await renderWithProviders(
      <>
        <SentMessage
          id={1}
          closeMenu={closeSent}
          isMenuOpen={false}
          created_at="2030-01-01T00:00:00.000Z"
          message_status={[]}
          message_type={{ name: "TextMessage" }}
        >
          <div>mine</div>
        </SentMessage>
        <ReceivedMessage
          id={2}
          closeMenu={closeReceived}
          isMenuOpen={false}
          message_type={{ name: "TextMessage" }}
          parent_message={null}
          isLonely={true}
          channel_member={null}
          isDeleted={false}
          onClick={vi.fn()}
          sender_message_id={99}
        >
          <div>theirs</div>
        </ReceivedMessage>
      </>,
    );
    fireEvent.mouseLeave(document.getElementById("main-container-1")!);
    fireEvent.mouseLeave(document.getElementById("main-container-2")!);
    expect(closeSent, "leaving my row did not close its menu").toHaveBeenCalled();
    expect(closeReceived, "leaving their row did not close its menu").toHaveBeenCalled();
  });
});
