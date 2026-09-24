import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const showErrorNotification = vi.fn();
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

import SearchVoice from "components/Home/Search/SearchVoice";

// jsdom has no microphone, no MediaRecorder and no speech recognition. These
// stand-ins record what the component asks of them.
let supported: string[] = [];
let recorders: FakeRecorder[] = [];
class FakeRecorder {
  static isTypeSupported = (t: string) => supported.includes(t);
  state = "inactive";
  ondataavailable: any = null;
  onstop: any = null;
  constructor(public stream: any, public options: any) {
    recorders.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["voice"]) });
    this.ondataavailable?.({ data: new Blob([]) });
    this.onstop?.();
  }
}

let speech: FakeSpeech[] = [];
class FakeSpeech {
  lang = "";
  onresult: any;
  onend: any;
  onerror: any;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    speech.push(this);
  }
}

let track: { stop: ReturnType<typeof vi.fn> };
const mic = (denied = false) =>
  Object.defineProperty(window.navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        if (denied) throw new Error("NotAllowedError");
        return { getTracks: () => [track] };
      }),
    },
  });

const micIcon = () => document.querySelector('[data-pw="searchVoiceIcon"]') as HTMLElement;
const tap = () => act(async () => fireEvent.click(micIcon()));
const answer = (body: any) => (globalThis.fetch as any).mockResolvedValue({ json: async () => body });

describe("SearchVoice", () => {
  beforeEach(() => {
    supported = ["audio/webm;codecs=opus"];
    recorders = [];
    speech = [];
    track = { stop: vi.fn() };
    showErrorNotification.mockReset();
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    vi.stubGlobal("fetch", vi.fn());
    mic();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    delete (window.navigator as any).mediaDevices;
  });

  it("tells the shopper when the browser cannot record", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    fireEvent.click(micIcon());
    expect(showErrorNotification, "an unsupported browser was not reported").toHaveBeenCalledWith("Browser does not support this feature");
  });

  it("tells the shopper when the microphone is refused", async () => {
    mic(true);
    await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    await tap();
    expect(showErrorNotification, "a refused microphone was not reported").toHaveBeenCalledWith("Microphone access denied");
  });

  it("records, sends the voice to speech recognition, and fills the search box", async () => {
    (window as any).webkitSpeechRecognition = FakeSpeech;
    answer({ success: true, transcription: "red shoes" });
    const setSearchValue = vi.fn();
    const { container } = await renderWithProviders(<SearchVoice setSearchValue={setSearchValue} />);
    await tap();
    expect(recorders[0].options.mimeType, "the best supported format was not chosen").toBe("audio/webm;codecs=opus");
    expect(micIcon().className, "the mic does not show it is listening").toContain("listening-icon-mic");
    expect(container.querySelector(".animate-ping"), "no recording indicator").not.toBeNull();
    expect(speech[0].lang, "the live fallback got the wrong language").toBe("en-US");
    await tap();
    await waitFor(() => expect(setSearchValue, "the transcription did not fill the search box").toHaveBeenCalledWith("red shoes"));
    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url, "the voice went to the wrong address").toBe("/api/speech-recognition");
    expect((init.body as FormData).get("language"), "the language was not sent").toBe("en");
    expect(track.stop, "the microphone was left on").toHaveBeenCalled();
    expect(speech[0].abort, "the live fallback was not dropped after a good answer").toHaveBeenCalled();
  });

  it("uses the live browser transcript when speech recognition hears nothing", async () => {
    (window as any).SpeechRecognition = FakeSpeech;
    answer({ success: true, transcription: "  " });
    const setSearchValue = vi.fn();
    await renderWithProviders(<SearchVoice setSearchValue={setSearchValue} />, { language: "ar" });
    await tap();
    expect(speech[0].lang, "Arabic did not get the Arabic recogniser").toBe("ar-SA");
    speech[0].onresult({ results: [[{ transcript: "حذاء" }]] });
    speech[0].onresult({ results: [] });
    await tap();
    act(() => speech[0].onend());
    await waitFor(() => expect(setSearchValue, "the live transcript was not used").toHaveBeenCalledWith("حذاء"));
  });

  it("gives up with a toast when neither recogniser heard anything, waiting at most 1.5 s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (window as any).SpeechRecognition = FakeSpeech;
    answer({ success: false });
    await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    await tap();
    await tap();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    await waitFor(() => expect(showErrorNotification, "no toast after nothing was heard").toHaveBeenCalledWith("Try again with clear voice"));
  });

  it("shows 'Failed to process audio' when speech recognition cannot be reached", async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error("offline"));
    await renderWithProviders(<SearchVoice setSearchValue={() => {}} />, {
      // Kurdish in the store only, so the toast text stays in English here.
      store: { language: "ku" },
    });
    await tap();
    expect(speech, "Kurdish started a browser recogniser it does not have").toEqual([]);
    await tap();
    await waitFor(() => expect(showErrorNotification, "a failed request was not reported").toHaveBeenCalledWith("Failed to process audio"));
  });

  it("settles the live fallback on an error, and survives a recogniser that throws", async () => {
    answer({ success: false });
    (window as any).SpeechRecognition = class extends FakeSpeech {
      stop = vi.fn(() => {
        throw new Error("already stopped");
      });
      abort = vi.fn(() => {
        throw new Error("gone");
      });
    };
    await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    await tap();
    act(() => speech[0].onerror());
    act(() => speech[0].onerror());
    await tap();
    await waitFor(() => expect(showErrorNotification, "no toast after the recogniser failed").toHaveBeenCalledWith("Try again with clear voice"));
  });

  it("keeps recording when the browser recogniser cannot even start", async () => {
    (window as any).SpeechRecognition = function () {
      throw new Error("blocked");
    };
    await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    await tap();
    expect(recorders[0].state, "a broken recogniser stopped the recording").toBe("recording");
  });

  it.each([
    [["audio/webm"], "audio/webm"],
    [["audio/mp4"], "audio/mp4"],
    [[], "audio/ogg;codecs=opus"],
  ])("falls back through the audio formats (%j supported)", async (list, chosen) => {
    supported = list as string[];
    await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    await tap();
    expect(recorders[0].options.mimeType, "the wrong audio format was chosen").toBe(chosen);
  });

  it("counts down and stops by itself after 8 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    await tap();
    const offset = () => Number(container.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset"));
    expect(offset(), "the countdown ring did not start full").toBe(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(offset(), "the countdown ring did not move").toBeGreaterThan(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });
    expect(micIcon().className, "the recording did not stop at 8 seconds").not.toContain("listening-icon-mic");
    expect(track.stop, "the microphone stayed on after 8 seconds").toHaveBeenCalled();
  });

  it("turns the microphone off and stops the timers when it goes away mid-recording", async () => {
    (window as any).SpeechRecognition = FakeSpeech;
    const { unmount } = await renderWithProviders(<SearchVoice setSearchValue={() => {}} />);
    await tap();
    unmount();
    expect(track.stop, "the microphone stayed on after closing").toHaveBeenCalled();
    expect(speech[0].abort, "the browser recogniser kept running after closing").toHaveBeenCalled();
  });
});
