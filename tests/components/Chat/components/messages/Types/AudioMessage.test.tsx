// A voice note bubble (components/Chat/components/messages/Types/AudioMessage.tsx):
// play / pause, the time shown, and the options it hands to its menu.
//
// jsdom cannot play media, so `play`, `pause` and `duration` are set on the
// audio element by hand. The options menu and the avatar are stand-ins.
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
