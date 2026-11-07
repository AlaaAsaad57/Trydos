import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { MediaSheet } from "components/DemoApp1/chat/ExtraSheets";
import type { MediaPage } from "components/DemoApp1/chat/chatContext";
import type { ChatMessage } from "components/DemoApp1/chat/chatModel";

// "Media & Files": the loaded messages, and the old chat's three tabs, which
// ask the chat backend for one kind of media (MediaContainer.jsx, a48d2cd10),
// a page at a time as the sheet scrolls.

const photoOf = (id: string) =>
  ({ id, kind: "photo", side: "in", src: `https://m.example/${id}.jpg`, time: "10:00" }) as ChatMessage;
const photo = photoOf("p1");
const video = { id: "v1", kind: "video", side: "in", src: "https://m.example/v.mp4", seconds: 3, time: "10:00" } as ChatMessage;
const file = { id: "f1", kind: "file", side: "in", src: "https://m.example/f.pdf", name: "report.pdf", time: "10:00" } as ChatMessage;

/** The last page of a kind, unless `more` says otherwise. */
const page = (messages: ChatMessage[], more = false): MediaPage => ({ messages, more });

/** jsdom has no IntersectionObserver: this one is told when to fire. */
class FakeObserver {
  static all: FakeObserver[] = [];
  root: unknown;
  constructor(
    private fire: (entries: { isIntersecting: boolean }[]) => void,
    options: { root?: unknown },
  ) {
    this.root = options.root;
    FakeObserver.all.push(this);
  }
  observe() {}
  disconnect() {
    FakeObserver.all = FakeObserver.all.filter((o) => o !== this);
  }
  reach() {
    this.fire([{ isIntersecting: true }]);
  }
}
beforeEach(() => {
  FakeObserver.all = [];
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const has = (pw: string) => !!document.querySelector(`[data-pw="${pw}"]`);
const el = (pw: string) => {
  const found = document.querySelector<HTMLElement>(`[data-pw="${pw}"]`);
  if (!found) throw new Error(`the sheet shows no element with data-pw "${pw}"`);
  return found;
};
const tiles = () =>
  [...document.querySelectorAll('[data-pw^="demo-media-item-"]')].map((t) =>
    t.getAttribute("data-pw")!.replace("demo-media-item-", ""),
  );

function sheet(media?: (type: string, before?: string) => Promise<MediaPage | null>, onPick = vi.fn()) {
  render(
    <MediaSheet
      open
      messages={[]}
      categories={[]}
      media={media as never}
      onPick={onPick}
      onClose={vi.fn()}
      t={(k: string) => k}
    />,
  );
  return onPick;
}
const pick = (chip: string) =>
  act(async () => {
    fireEvent.click(el(`demo-media-chip-${chip}`));
  });
/** The shopper scrolled near the end of the sheet. */
const reachEnd = () =>
  act(async () => {
    FakeObserver.all[FakeObserver.all.length - 1]?.reach();
  });

describe("the Media & Files sheet's kinds", () => {
  it("has no kind chips on /demo, which has no chat backend", () => {
    sheet();
    expect(has("demo-media-chip-image"), "the /demo sheet changed: it shows a kind chip").toBe(false);
  });

  it("asks the chat backend for the photos, and shows them", async () => {
    const media = vi.fn(async () => page([photo]));
    sheet(media);
    await pick("image");
    expect(media, "the photos were not asked for").toHaveBeenCalledWith("ImageMessage");
    expect(has("demo-media-item-p1"), "the photo from the chat backend is not shown").toBe(true);
  });

  it("asks for the videos, and shows them", async () => {
    const media = vi.fn(async () => page([video]));
    sheet(media);
    await pick("video");
    expect(media, "the videos were not asked for").toHaveBeenCalledWith("VideoMessage");
    expect(has("demo-media-item-v1"), "the video from the chat backend is not shown").toBe(true);
  });

  it("asks for the files, and shows them", async () => {
    const media = vi.fn(async () => page([file]));
    sheet(media);
    await pick("file");
    expect(media, "the files were not asked for").toHaveBeenCalledWith("FileMessage");
    expect(el("demo-media-file-f1").textContent, "the file's name is not shown").toContain("report.pdf");
  });

  it("a tap shows the message, as the loaded ones do", async () => {
    const onPick = sheet(vi.fn(async () => page([photo])));
    await pick("image");
    fireEvent.click(el("demo-media-item-p1"));
    expect(onPick, "a tap did not ask for the message").toHaveBeenCalledWith("p1");
  });

  it("says so when the chat backend fails", async () => {
    sheet(vi.fn(async () => null));
    await pick("image");
    expect(el("demo-media-sheet").textContent, "a failed read shows nothing").toContain("Could not load the messages");
  });

  it("says Empty when the chat has none of that kind", async () => {
    sheet(vi.fn(async () => page([])));
    await pick("video");
    expect(el("demo-media-sheet").textContent, "an empty kind shows nothing").toContain("Empty");
  });

  it("an answer that comes after the shopper moved on is dropped", async () => {
    let answerPhotos: (answer: MediaPage) => void = () => {};
    const media = vi.fn((type: string) =>
      type === "ImageMessage" ? new Promise<MediaPage>((done) => (answerPhotos = done)) : Promise.resolve(page([file])),
    );
    sheet(media);
    await pick("image");
    await pick("file");
    await act(async () => answerPhotos(page([photo])));
    expect(has("demo-media-item-p1"), "the late photos replaced the files on screen").toBe(false);
  });
});

describe("the Media & Files sheet's pages", () => {
  const first = [photoOf("p3"), photoOf("p2")];

  it("watches the sheet's own scroll box, so the next page comes before the end shows", async () => {
    sheet(vi.fn(async () => page(first, true)));
    await pick("image");
    expect(has("demo-media-more"), "the sheet has nothing to ask for the next page").toBe(true);
    expect(
      FakeObserver.all[FakeObserver.all.length - 1]?.root,
      "the edge watches the window, not the box that scrolls",
    ).toBe(el("demo-media-sheet-list"));
  });

  it("has no edge after the last page", async () => {
    sheet(vi.fn(async () => page(first)));
    await pick("image");
    expect(has("demo-media-more"), "the last page still asks for more").toBe(false);
  });

  it("asks for the page before the oldest one shown, and adds it after it", async () => {
    const media = vi.fn(async (_type: string, before?: string) =>
      before ? page([photoOf("p1")]) : page(first, true),
    );
    sheet(media);
    await pick("image");
    await reachEnd();
    expect(media, "the next page was not asked for before the oldest photo").toHaveBeenLastCalledWith("ImageMessage", "p2");
    expect(tiles(), "the older photos are not after the newer ones").toEqual(["p3", "p2", "p1"]);
  });

  it("goes on while the chat backend says there is more", async () => {
    const media = vi.fn(async (_type: string, before?: string) =>
      before === "p2" ? page([photoOf("p1")], true) : before ? page([photoOf("p0")]) : page(first, true),
    );
    sheet(media);
    await pick("image");
    await reachEnd();
    await reachEnd();
    expect(tiles(), "the third page did not come").toEqual(["p3", "p2", "p1", "p0"]);
    expect(has("demo-media-more"), "the end of the media still asks for more").toBe(false);
  });

  it("stops, with no photo twice, when a page brings nothing new", async () => {
    const media = vi.fn(async () => page(first, true));
    sheet(media);
    await pick("image");
    await reachEnd();
    expect(tiles(), "a repeated page showed its photos twice").toEqual(["p3", "p2"]);
    expect(has("demo-media-more"), "a repeated page left the sheet asking for ever").toBe(false);
  });

  it("does not ask twice while a page is on its way", async () => {
    const media = vi.fn((_type: string, before?: string) =>
      before ? new Promise<MediaPage>(() => {}) : Promise.resolve(page(first, true)),
    );
    sheet(media);
    await pick("image");
    await reachEnd();
    await reachEnd();
    expect(
      media.mock.calls.filter(([, before]) => before),
      "a second page was asked for while one was on its way",
    ).toEqual([["ImageMessage", "p2"]]);
  });

  it("keeps what it shows when a page fails, and tries again on the next scroll", async () => {
    const media = vi
      .fn<(type: string, before?: string) => Promise<MediaPage | null>>()
      .mockResolvedValueOnce(page(first, true))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(page([photoOf("p1")]));
    sheet(media);
    await pick("image");
    await reachEnd();
    expect(tiles(), "a failed page took the photos away").toEqual(["p3", "p2"]);
    await reachEnd();
    expect(tiles(), "the next scroll did not try the failed page again").toEqual(["p3", "p2", "p1"]);
  });

  it("drops a page that comes after the shopper picked another kind", async () => {
    let answerOlder: (answer: MediaPage) => void = () => {};
    const media = vi.fn((type: string, before?: string) =>
      before
        ? new Promise<MediaPage>((done) => (answerOlder = done))
        : Promise.resolve(type === "ImageMessage" ? page(first, true) : page([file])),
    );
    sheet(media);
    await pick("image");
    await reachEnd();
    await pick("file");
    await act(async () => answerOlder(page([photoOf("p1")])));
    expect(has("demo-media-item-p1"), "a late page of photos came into the files").toBe(false);
  });

  it("a new kind starts from its own first page", async () => {
    const media = vi.fn(async (type: string, before?: string) =>
      type === "ImageMessage" ? page(first, true) : page(before ? [] : [video], true),
    );
    sheet(media);
    await pick("image");
    await pick("video");
    expect(media, "the videos' first page went out with a photo's cursor").toHaveBeenLastCalledWith("VideoMessage");
    expect(tiles(), "photos stayed in the videos").toEqual(["v1"]);
  });
});
