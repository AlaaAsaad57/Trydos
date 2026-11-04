// A voice note bubble (components/Chat/components/messages/Types/AudioMessage.tsx):
// play / pause, the time shown, and the options it hands to its menu.
//
// jsdom cannot play media, so `play`, `pause` and `duration` are set on the
// audio element by hand. The options menu and the avatar are stand-ins.
import { readFileSync } from "node:fs";
import path from "node:path";

import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../../render";

const h = vi.hoisted(() => ({ menu: null as any, deleteMessage: null as any }));

vi.mock("components/Chat/components/OptionsMenu", () => ({
  default: (p: any) => {
    h.menu = p;
    return <div data-testid="menu" />;
  },
}));
vi.mock("components/Chat/components/ChatPhoto", () => ({ default: () => <div data-testid="avatar" /> }));
vi.mock("store/chat/chatUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  DeleteMessage: (...a: any[]) => h.deleteMessage(...a),
}));

import AudioMessage from "components/Chat/components/messages/Types/AudioMessage";
import { finishUpload, startUpload } from "components/Chat/uploadCancel";

const ME = 1;

function props(extra: Record<string, any> = {}) {
  return {
    setOpen: vi.fn(),
    setDelete: vi.fn(),
    openMenu: false,
    type: "lonely",
    sender_user_id: ME,
    is_forward: 0,
    isPrivate: null,
    message_status: [],
    created_at: "2030-01-15T08:05:00",
    mid: null,
    id: 5,
    DeleteModal: false,
    parent_message: null,
    GetMessage: vi.fn(),
    parent_message_id: null,
    message_files: [{ file_path: "https://example.com/v.mp3" }],
    channel_id: 7,
    channel_member: { name: "Me" },
    is_from_sender: true,
    ...extra,
  };
}

async function mount(extra: Record<string, any> = {}, activeChat: any = { id: 7, channel_members: [{ user_id: ME, user: { name: "Me" } }] }) {
  const p = props(extra);
  const spies = { setForwardMessage: vi.fn(), setReplyMessage: vi.fn() };
  const r = await renderWithProviders(<AudioMessage {...(p as any)} />, {
    store: { userChat: { id: ME }, activeChat, ...spies },
  });
  const audio = document.querySelector("audio") as HTMLAudioElement;
  return { ...r, p, spies, audio };
}

function loaded(audio: HTMLAudioElement, duration: number) {
  Object.defineProperty(audio, "duration", { value: duration, configurable: true });
  fireEvent.loadedMetadata(audio);
}

beforeEach(() => {
  h.deleteMessage = vi.fn();
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
  HTMLMediaElement.prototype.pause = vi.fn();
});

describe("AudioMessage", () => {
  it("shows a spinner until the length is known, then the length", async () => {
    const { audio } = await mount();
    expect(document.querySelector(".player-time")?.textContent, "a time was shown before the audio loaded").toBe("");
    loaded(audio, 75);
    expect(document.querySelector(".player-time")?.textContent, "the length was not shown as MM:SS").toBe("01:15");
    loaded(audio, 700);
    expect(document.querySelector(".player-time")?.textContent, "a long note was not shown as MM:SS").toBe("11:40");
  });

  it("plays, counts down, pauses and rewinds at the end", async () => {
    const { audio } = await mount();
    loaded(audio, 30);
    Object.defineProperty(audio, "paused", { value: true, configurable: true });
    fireEvent.click(document.querySelector(".play-icon")!);
    expect(HTMLMediaElement.prototype.play, "the note did not play").toHaveBeenCalled();
    expect((document.querySelector(".play-icon") as HTMLImageElement).src, "the pause icon was not shown").toContain("pause.svg");
    audio.currentTime = 10;
    fireEvent.timeUpdate(audio);
    expect(document.querySelector(".player-time")?.textContent, "the time left was not counted down").toBe("00:20");
    Object.defineProperty(audio, "paused", { value: false, configurable: true });
    fireEvent.click(document.querySelector(".play-icon")!);
    expect(HTMLMediaElement.prototype.pause, "the note did not pause").toHaveBeenCalled();
    fireEvent.ended(audio);
    expect(audio.currentTime, "the note did not rewind at the end").toBe(0);
  });

  it("works out the length of a recording that reports no duration", async () => {
    const { audio } = await mount();
    loaded(audio, Infinity);
    expect(document.querySelector(".player-time")?.textContent, "an unknown length showed a time").toBe("");
    Object.defineProperty(audio, "duration", { value: 12, configurable: true });
    act(() => {
      audio.ontimeupdate!.call(audio, new Event("timeupdate"));
    });
    expect(document.querySelector(".player-time")?.textContent, "the worked-out length was not shown").toBe("00:12");
    act(() => {
      (audio.ontimeupdate as any)();
    });
  });

  it("shows the forward mark, the avatar and the receive time for someone else's note", async () => {
    await mount({ is_forward: 1, is_from_sender: false, type: "first-chat" });
    expect(document.querySelector(".forwarded-message-icon"), "the forward mark was not shown").not.toBeNull();
    expect(screen.getByTestId("avatar"), "the avatar was not shown on the first bubble").toBeInTheDocument();
    expect(document.querySelector(".other-date")?.textContent, "the time was not shown").toBe("08:05");
    expect(document.querySelector(".absolute-avatar")!.className, "a member with a name and no photo got no text avatar").toContain("text-avatar");
  });

  it("shows nothing for a note with no file, and no avatar in the middle of a run", async () => {
    await mount({ message_files: [{ file_path: "false" }] }, null);
    expect(document.querySelector("audio"), "a note with no file showed a player").toBeNull();
    await mount({ type: "middle-chat" });
    expect(screen.queryByTestId("avatar"), "a middle bubble showed an avatar").toBeNull();
  });

  it("opens the menu on a tap and closes it when the pointer leaves", async () => {
    const { p } = await mount({ openMenu: true });
    fireEvent.click(document.querySelector(".audio-body")!);
    expect(p.setOpen, "a tap did not open the menu").toHaveBeenCalledWith(5);
    fireEvent.mouseLeave(document.querySelector(".message-hold")!);
    expect(p.setOpen, "leaving did not close the menu").toHaveBeenCalledWith(false);
  });

  it("while the note uploads, the cancel X sits where the play button and spinner go, and stops the upload", async () => {
    const onCancel = vi.fn();
    const signal = startUpload("m-voice", onCancel);
    try {
      const { p, audio } = await mount({ mid: "m-voice" });
      // The base64 preview can load before the upload ends; the X must still win.
      loaded(audio, 4);
      const cancel = screen.queryByRole("button", { name: /cancel upload/i });
      expect(cancel, "an uploading voice note offers no cancel X").not.toBeNull();
      expect(cancel!.closest(".audio-message"), "the cancel X is not in the play/spinner place of the voice note").not.toBeNull();
      expect(cancel!.closest(".message-date"), "the cancel X is still in the status line under the voice note").toBeNull();
      expect(document.querySelector('img[src="/icons/chat/play.svg"]'), "the play button is shown next to the cancel X").toBeNull();
      expect(document.querySelector('.audio-message [data-pw="spinner-container2"]'), "the spinner is shown next to the cancel X").toBeNull();

      fireEvent.click(cancel!);
      expect(signal.aborted, "pressing the X did not stop the voice note upload").toBe(true);
      expect(onCancel, "pressing the X did not remove the pending voice note").toHaveBeenCalled();
      expect(p.setOpen, "pressing the X also opened the message menu").not.toHaveBeenCalled();
    } finally {
      finishUpload("m-voice");
    }
  });

  it("the menu replies, forwards and deletes this note", async () => {
    const { p, spies } = await mount();
    h.menu.click();
    expect(spies.setReplyMessage.mock.calls[0][0].message_type, "the reply was not a voice note").toEqual({ name: "VoiceMessage" });
    h.menu.forward();
    expect(spies.setForwardMessage.mock.calls[0][0].id, "the forward was not this note").toBe(5);
    h.menu.deleteMessage(true);
    expect(h.deleteMessage, "the note was not deleted for everyone").toHaveBeenCalledWith(7, 5, true);
    h.menu.setDelete(true);
    expect(p.setDelete, "the delete box was not opened").toHaveBeenCalledWith(true);
    h.menu.copy();
  });
});

// A swipe to the right moves a sent bubble 18 px (SNAP_OFFSET in
// useMessageSwipe.ts) and shows its dates 8 px to its left (SentMessage.tsx).
// The chat list (ConversationContainer.tsx, px-[20px], overflow-x hidden)
// cuts anything left of its own edge.
//
// A voice bubble was 340 px wide at every width. On a phone under 400 px the
// dates did not fit in the room on its left. The hook then pushed the bubble
// further right (up to 33 px on a 375 px phone, measured in WebKit), so the
// dates showed but the list cut the bubble's right side instead.
//
// jsdom does no layout, so this case reads the rules in ChatWindow.css and does
// the same sums a browser does. The dates box is 39-41 px wide (measured in
// Chromium and WebKit with three rows); 41 is used.
describe("AudioMessage — the bubble's width on a phone", () => {
  const css = readFileSync(path.resolve(process.cwd(), "public/styles/ChatWindow.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  const LIST_PADDING = 20;
  const DATES_GAP = 8;
  const DATES_WIDTH = 41;
  const NUDGE = 18;
  const EDGE_GAP = 4;

  /** Every top-level `@media (max-width: Npx)` block, with its N and body. */
  const mediaBlocks = () => {
    const blocks: { max: number; body: string }[] = [];
    const re = /@media[^{]*max-width:\s*([\d.]+)px[^{]*\{/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css))) {
      let depth = 1;
      let i = re.lastIndex;
      while (depth > 0 && i < css.length) {
        if (css[i] === "{") depth++;
        if (css[i] === "}") depth--;
        i++;
      }
      blocks.push({ max: parseFloat(m[1]), body: css.slice(re.lastIndex, i - 1) });
    }
    return blocks;
  };
  const ruleIn = (body: string, selector: string) =>
    body
      .split("}")
      .map((chunk) => chunk.split("{"))
      .find(([sel]) => sel.trim() === selector)?.[1] ?? "";
  const value = (block: string, prop: string) =>
    block
      .split(";")
      .map((d) => d.split(":"))
      .find(([name]) => name.trim() === prop)
      ?.slice(1)
      .join(":")
      .trim();

  /** The voice bubble's width at a screen `width`, from the rules in the file. */
  const bubbleWidth = (width: number) => {
    let result = parseFloat(value(ruleIn(css, ".audio-body"), "width") ?? "");
    for (const block of mediaBlocks()) {
      if (width > block.max) continue;
      const w = value(ruleIn(block.body, ".audio-body"), "width");
      const m = w?.match(/^calc\(100vw - ([\d.]+)px\)$/);
      if (m) result = width - parseFloat(m[1]);
    }
    return result;
  };

  it("leaves room for the dates on the bubble's left at every phone width, 320 to 430 px", () => {
    const cut: string[] = [];
    for (let width = 320; width <= 430; width++) {
      const bubble = bubbleWidth(width);
      const bubbleLeft = width - LIST_PADDING - bubble;
      const datesLeft = bubbleLeft - DATES_GAP - DATES_WIDTH + NUDGE;
      if (datesLeft < EDGE_GAP) cut.push(`${width}px (bubble ${bubble}px, dates at x=${datesLeft})`);
    }
    expect(
      cut,
      `after the 18 px swipe the dates start left of the chat list's edge, so they are cut (or the bubble is pushed past the right edge) at: ${cut.slice(0, 3).join(", ")}${cut.length > 3 ? ", …" : ""}`,
    ).toEqual([]);
  });

  // A narrower bubble alone is not enough: the player inside is 200-220 px of
  // fixed widths. If it cannot shrink, it spills out of the bubble's right side.
  it("lets the player inside a narrow bubble shrink with it", () => {
    const phone = mediaBlocks().find((b) => value(ruleIn(b.body, ".audio-body"), "width"));
    expect(phone, "no phone rule makes the voice bubble narrower").toBeDefined();
    for (const selector of [".audio-body .audio-message", ".audio-body .player-cont"]) {
      expect(
        value(ruleIn(phone!.body, selector), "min-width"),
        `${selector} keeps its content width on a phone, so the player spills out of the narrow bubble`,
      ).toBe("0");
    }
    expect(
      value(ruleIn(phone!.body, ".audio-body .player-line"), "width"),
      "the player line keeps its fixed 220 px on a phone, so it spills out of the narrow bubble",
    ).toBe("100%");
  });
});
