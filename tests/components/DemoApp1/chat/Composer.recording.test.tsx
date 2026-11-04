import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import Composer, { MIN_RECORD_MS } from "components/DemoApp1/chat/Composer";

// The composer's microphone records real sound while it is held (Stage 6,
// step 3c), and its pickers hand over the real files. The browser's
// microphone is faked here: no sound device is used.

class FakeRecorder {
  static last: FakeRecorder | null = null;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: MediaStream) {
    FakeRecorder.last = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["sound"], { type: "audio/webm" }) });
    this.onstop?.();
  }
}

const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;

const props = () => ({
  context: null,
  onCancelContext: vi.fn(),
  onSend: vi.fn(),
  onSendPhoto: vi.fn(),
  onSendVoice: vi.fn(),
  onSendVideo: vi.fn(),
  onSendFile: vi.fn(),
  onSendLocation: vi.fn(),
  onTyping: vi.fn(),
  onToast: vi.fn(),
  t: (key: string) => key,
});

/** Holds the microphone for `ms`, then lets go. */
async function hold(ms: number) {
  const mic = document.querySelector<HTMLElement>('[data-pw="demo-chat-mic"]');
  if (!mic) throw new Error("the composer shows no microphone button (data-pw demo-chat-mic)");
  fireEvent.pointerDown(mic, { pointerId: 1, clientX: 300 });
  await act(async () => {
    await Promise.resolve();
  });
  vi.setSystemTime(Date.now() + ms);
  fireEvent.pointerUp(mic, { pointerId: 1, clientX: 300 });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  FakeRecorder.last = null;
  stopTrack.mockClear();
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => stream) },
  });
  // jsdom has no pointer capture.
  HTMLElement.prototype.setPointerCapture = vi.fn();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("the composer's microphone", () => {
  it("records while held and sends the sound and the seconds held when let go", async () => {
    const p = props();
    render(<Composer {...p} />);
    await hold(3200);
    expect(p.onSendVoice, "the recording was not sent when the microphone was let go").toHaveBeenCalledTimes(1);
    const [audio, seconds] = p.onSendVoice.mock.calls[0];
    expect(audio, "the voice note is not the recorded sound").toBeInstanceOf(Blob);
    expect((audio as Blob).size, "the voice note has no sound in it").toBeGreaterThan(0);
    expect(seconds, "the voice note's length is not the 3 seconds held").toBe(3);
    expect(stopTrack, "the microphone stayed on after the recording").toHaveBeenCalled();
  });

  it("a hold shorter than the minimum sends nothing, says 'Hold to record', and turns the microphone off", async () => {
    const p = props();
    render(<Composer {...p} />);
    await hold(MIN_RECORD_MS - 100);
    expect(p.onSendVoice, "a short tap sent a voice note").not.toHaveBeenCalled();
    expect(p.onToast, "a short tap did not say 'Hold to record'").toHaveBeenCalledWith("Hold to record");
    expect(stopTrack, "the microphone stayed on after a short tap").toHaveBeenCalled();
  });

  it("with no microphone it says 'No available Microphone' and sends nothing", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => Promise.reject(new Error("NotAllowedError"))) },
    });
    const p = props();
    render(<Composer {...p} />);
    await hold(3000);
    expect(p.onToast, "a refused microphone did not say 'No available Microphone'").toHaveBeenCalledWith(
      "No available Microphone",
    );
    expect(p.onSendVoice, "a refused microphone sent a voice note").not.toHaveBeenCalled();
  });
});

describe("the composer's pickers", () => {
  it("hands over the picked photo and file themselves, not an address", () => {
    const p = props();
    const { container } = render(<Composer {...p} />);
    const photo = new File(["img"], "pic.jpg", { type: "image/jpeg" });
    const doc = new File(["pdf"], "a.pdf", { type: "application/pdf" });
    const inputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const byAccept = (accept: string | null) => [...inputs].find((i) => i.getAttribute("accept") === accept && !i.hasAttribute("capture"));
    fireEvent.change(byAccept("image/*")!, { target: { files: [photo] } });
    fireEvent.change(byAccept(null)!, { target: { files: [doc] } });
    expect(p.onSendPhoto, "the picked photo was not handed over as the file").toHaveBeenCalledWith(photo);
    expect(p.onSendFile, "the picked file was not handed over as the file").toHaveBeenCalledWith(doc);
  });

  it("says the shopper is typing when the field changes", () => {
    const p = props();
    render(<Composer {...p} />);
    const field = document.querySelector('[data-pw="demo-chat-input"]');
    if (!field) throw new Error("the composer shows no field (data-pw demo-chat-input)");
    fireEvent.change(field, { target: { value: "H" } });
    expect(p.onTyping, "typing in the field did not tell the chat").toHaveBeenCalled();
  });
});
