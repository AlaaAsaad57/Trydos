// The "Tagged messages" block of the chat info panel
// (components/Chat/components/TaggedMessages.tsx).
//
// A tap on a tagged message can take a while: the message may be far up the
// chat, and the messages up to it load first. The row must show that it is
// working until the jump is done. The list also scrolls on its own, so a long
// list does not push the rest of the panel away.
import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  getTagged: vi.fn(),
}));

vi.mock("store/chat/actions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  GetTaggedMessages: (...a: any[]) => h.getTagged(...a),
}));

import TaggedMessages from "components/Chat/components/TaggedMessages";

const tagged = (id: string, content: string) => ({
  id,
  created_at: "2026-09-20T10:00:00.000Z",
  message_type: { name: "TextMessage" },
  message_content: { content },
});

async function mountWithUrgent(openMessage: (id: string | number) => Promise<void> | void) {
  h.getTagged.mockResolvedValue([tagged("5", "pay the invoice"), tagged("6", "call back")]);
  await renderWithProviders(<TaggedMessages channelId="40" openMessage={openMessage} />);
  await act(async () => {
    fireEvent.click(document.querySelector('[data-pw="TAGGED-FILTER-urgent"]')!);
  });
}

beforeEach(() => {
  h.getTagged.mockReset();
});

describe("TaggedMessages", () => {
  it("shows a spinner on the tapped row until the jump to the message is done", async () => {
    let done!: () => void;
    const openMessage = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          done = resolve;
        }),
    );
    await mountWithUrgent(openMessage);

    const rowOf = () => screen.getByText("pay the invoice").closest("button")!;
    await act(async () => fireEvent.click(rowOf()));

    expect(openMessage, "the tapped tagged message was not opened").toHaveBeenCalledWith("5");
    expect(
      rowOf().querySelector('[data-pw="SpinneR"]'),
      "the tapped row showed no spinner while its message was loading",
    ).not.toBeNull();

    await act(async () => done());
    expect(
      rowOf().querySelector('[data-pw="SpinneR"]'),
      "the spinner stayed after the jump was done",
    ).toBeNull();
  });

  it("scrolls the list of tagged messages on its own", async () => {
    await mountWithUrgent(vi.fn());
    const list = document.querySelector('[data-pw="TAGGED-MESSAGES-LIST"]') as HTMLElement | null;
    expect(list, "the tagged messages have no list box of their own").not.toBeNull();
    expect(list!.style.overflowY, "the tagged messages list does not scroll by itself").toBe("auto");
    expect(list!.style.maxHeight, "the tagged messages list has no height limit, so it never scrolls").not.toBe("");
    expect(
      list!.textContent,
      "the tagged messages were not listed inside the scroll box",
    ).toContain("pay the invoice");
  });
});
