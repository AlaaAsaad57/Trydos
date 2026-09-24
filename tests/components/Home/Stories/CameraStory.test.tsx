import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The camera. jsdom has none, so the stand-in hands out a fixed screenshot and
// a stream object, and shows which constraints and audio setting it was given.
const cam = vi.hoisted(() => ({ screenshot: "data:image/webp;base64,AAAA" as string | null, stream: {} as any }));
vi.mock("react-webcam", () => ({
  default: forwardRef((props: any, ref) => {
    useImperativeHandle(ref, () => ({ getScreenshot: () => cam.screenshot, stream: cam.stream }));
    return <div data-testid="webcam" data-facing={props.videoConstraints.facingMode} data-audio={String(props.audio)} />;
  }),
}));

// The stopwatch, driven by hand so "59 seconds have passed" is one line.
const timer = vi.hoisted(() => ({ seconds: 0, minutes: 0, start: vi.fn(), pause: vi.fn(), reset: vi.fn() }));
vi.mock("react-timer-hook", () => ({ useStopwatch: () => ({ ...timer }) }));

import NewStoryModal from "components/Home/Stories/CameraStory";

// jsdom has no MediaRecorder. This one records its lifecycle and, like the
// real one, hands over the recording in a "dataavailable" event on stop.
let recorders: FakeRecorder[] = [];
class FakeRecorder extends EventTarget {
  state = "inactive";
  constructor(public stream: any, public options: any) {
    super();
    recorders.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    const ev = new Event("dataavailable") as any;
    ev.data = new Blob(["frames"], { type: "video/webm" });
    this.dispatchEvent(ev);
  }
}

const media = (devices: any[] | Error, mic: "ok" | "denied" = "ok") => {
  Object.defineProperty(window.navigator, "mediaDevices", {
    configurable: true,
    value: {
      enumerateDevices: vi.fn(async () => {
        if (devices instanceof Error) throw devices;
        return devices;
      }),
      getUserMedia: vi.fn(async () => {
        if (mic === "denied") throw new Error("denied");
        return { getTracks: () => [{ stop: vi.fn() }] };
      }),
    },
  });
};

const props = () => ({ close: vi.fn(), send: vi.fn(), HandleUploadedVideo: vi.fn() });
const buttons = () => screen.getAllByRole("button");
/** Bottom row: [flip, center, discard]. Top: [back, (photo, video)]. */
const flip = () =>
  buttons().find((b) => b.className.includes("p-3") && b.querySelector('path[d^="M16 15"]')) as HTMLButtonElement;
const center = () => buttons().find((b) => b.className.includes("w-20") || b.className.includes("w-16 h-16"))!;
const back = () => buttons()[0];
const discard = () => buttons()[buttons().length - 1];

describe("CameraStory (NewStoryModal)", () => {
  beforeEach(() => {
    recorders = [];
    cam.screenshot = "data:image/webp;base64,AAAA";
    cam.stream = {};
    timer.seconds = 0;
    timer.minutes = 0;
    timer.start.mockReset();
    timer.reset.mockReset();
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    (URL as any).createObjectURL = vi.fn(() => "blob:recording");
    vi.spyOn(window, "stop").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (window.navigator as any).mediaDevices;
    delete (URL as any).createObjectURL;
  });

  it("flips between the front and back camera when there are two", async () => {
    media([{ kind: "videoinput" }, { kind: "videoinput" }, { kind: "audioinput" }]);
    render(<NewStoryModal {...props()} />);
    await waitFor(() => expect(flip().disabled, "flip stayed off with two cameras").toBe(false));
    fireEvent.click(flip());
    expect(screen.getByTestId("webcam").dataset.facing, "flip did not switch to the back camera").toBe("environment");
    fireEvent.click(flip());
    expect(screen.getByTestId("webcam").dataset.facing, "flip did not switch back to the front camera").toBe("user");
  });

  it.each([
    ["one camera", [{ kind: "videoinput" }]],
    ["a failed device list", new Error("no permission")],
  ])("turns flip off with %s", async (_n, devices) => {
    media(devices as any);
    render(<NewStoryModal {...props()} />);
    await waitFor(() => expect(flip().disabled, "flip stayed on").toBe(true));
  });

  it("turns flip off when the browser has no media devices at all", async () => {
    render(<NewStoryModal {...props()} />);
    await waitFor(() => expect(flip().disabled, "flip stayed on without media devices").toBe(true));
  });

  it("takes a photo, previews it, and shares it", async () => {
    media([]);
    const p = props();
    render(<NewStoryModal {...p} />);
    expect(screen.getByText("Create Story"), "the start title is wrong").toBeInTheDocument();
    fireEvent.click(center());
    expect(screen.getByText("Preview Photo"), "the photo was not previewed").toBeInTheDocument();
    expect(screen.getByAltText("Story Preview"), "the preview picture is missing").toBeInTheDocument();
    fireEvent.click(screen.getAllByAltText("Share")[0].closest("button")!);
    expect(p.send, "the photo was not sent").toHaveBeenCalledWith("data:image/webp;base64,AAAA");
    expect(p.close, "the camera did not close after sharing").toHaveBeenCalled();
  });

  it("does nothing when the camera gives no picture", async () => {
    media([]);
    cam.screenshot = null;
    render(<NewStoryModal {...props()} />);
    fireEvent.click(center());
    expect(screen.getByText("Create Story"), "a missing picture opened the preview").toBeInTheDocument();
  });

  it("discards a photo with the back and the X buttons, then closes", async () => {
    media([]);
    const p = props();
    render(<NewStoryModal {...p} />);
    fireEvent.click(center());
    fireEvent.click(back());
    expect(screen.getByText("Create Story"), "back did not discard the photo").toBeInTheDocument();
    fireEvent.click(center());
    fireEvent.click(discard());
    expect(screen.getByText("Create Story"), "the X did not discard the photo").toBeInTheDocument();
    expect(p.close, "discarding closed the camera").not.toHaveBeenCalled();
    fireEvent.click(back());
    fireEvent.click(discard());
    expect(p.close, "back and X on the camera itself should each close it").toHaveBeenCalledTimes(2);
  });

  it("records a video with sound, previews it and shares it as a webm file", async () => {
    media([], "ok");
    const p = props();
    render(<NewStoryModal {...p} />);
    fireEvent.click(screen.getByText("Video"));
    await waitFor(() => expect(screen.getByTestId("webcam").dataset.audio, "a working microphone was not used").toBe("true"));
    fireEvent.click(center());
    expect(timer.start, "the timer did not start").toHaveBeenCalled();
    expect(recorders[0].options, "the recording is not webm").toEqual({ mimeType: "video/webm" });
    expect(screen.getByText("00:00"), "the timer is not shown while recording").toBeInTheDocument();
    act(() => fireEvent.click(center()));
    expect(screen.getByText("Preview Video"), "the recording was not previewed").toBeInTheDocument();
    fireEvent.click(screen.getAllByAltText("Share")[0].closest("button")!);
    const file: File = p.HandleUploadedVideo.mock.calls[0][0];
    expect(file.type, "the shared video is not webm").toBe("video/webm");
    expect(file.name, "the shared video has the wrong name").toMatch(/^video-story-\d+\.webm$/);
    expect(p.close, "the camera did not close after sharing the video").toHaveBeenCalled();
  });

  it("warns when the microphone is refused and records without sound", async () => {
    media([], "denied");
    render(<NewStoryModal {...props()} />);
    fireEvent.click(screen.getByText("Video"));
    expect(
      await screen.findByText("Microphone not detected or permission denied"),
      "a refused microphone was not reported",
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Photo"));
    expect(screen.queryByText("Microphone not detected or permission denied"), "the warning stayed on the photo tab").toBeNull();
  });

  it("does not record without a camera stream", async () => {
    media([]);
    cam.stream = null;
    render(<NewStoryModal {...props()} />);
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(center());
    expect(recorders, "a recording started with no stream").toEqual([]);
  });

  it("stops recording by itself at one minute", async () => {
    media([]);
    const p = props();
    const { rerender } = render(<NewStoryModal {...p} />);
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(center());
    timer.seconds = 59;
    act(() => rerender(<NewStoryModal {...p} />));
    expect(recorders[0].state, "the recording ran past the one-minute cap").toBe("inactive");
    expect(screen.getByText("Preview Video"), "the capped recording was not previewed").toBeInTheDocument();
  });

  it("discards a video with back and X, and does not share an empty recording", async () => {
    media([]);
    const p = props();
    render(<NewStoryModal {...p} />);
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(center());
    act(() => fireEvent.click(center()));
    fireEvent.click(back());
    expect(screen.getByText("Create Story"), "back did not discard the video").toBeInTheDocument();
    fireEvent.click(center());
    act(() => fireEvent.click(center()));
    fireEvent.click(discard());
    expect(screen.getByText("Create Story"), "the X did not discard the video").toBeInTheDocument();
    expect(p.close, "discarding a video closed the camera").not.toHaveBeenCalled();
  });

  it("stops a recorder that already stopped without stopping it twice", async () => {
    media([]);
    render(<NewStoryModal {...props()} />);
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(center());
    recorders[0].state = "inactive";
    const stop = vi.spyOn(recorders[0], "stop");
    act(() => fireEvent.click(center()));
    expect(stop, "an inactive recorder was stopped again").not.toHaveBeenCalled();
  });

  it("ignores an empty chunk from the recorder", async () => {
    media([]);
    const p = props();
    render(<NewStoryModal {...p} />);
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(center());
    const ev = new Event("dataavailable") as any;
    ev.data = new Blob([]);
    act(() => {
      recorders[0].dispatchEvent(ev);
    });
    expect(screen.queryByText("Preview Video"), "an empty chunk opened the preview").toBeNull();
  });

  // BUG-home-5: CameraStory.tsx:108-114 — handleStopCapture calls `stop()`, but
  // `stop` is never taken from useStopwatch (line 33 takes seconds, minutes,
  // start, pause, reset). The name resolves to the browser's `window.stop()`,
  // which cancels every download the page still has in flight, and the
  // stopwatch is never paused.
  it("BUG-home-5: stopping a video recording pauses the stopwatch, not the page", async () => {
    media([]);
    render(<NewStoryModal {...props()} />);
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(center());
    act(() => fireEvent.click(center()));
    expect(window.stop, "stopping a recording must not stop the whole page from loading").not.toHaveBeenCalled();
    expect(timer.pause, "stopping a recording must pause the stopwatch").toHaveBeenCalled();
  });
});
