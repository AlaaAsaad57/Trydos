// The chat camera (components/Chat/components/CameraComponent.tsx): take a
// photo or record a short video, preview it, then send or discard it.
//
// react-webcam is replaced by a stand-in that hands the component a fake
// screenshot and stream. jsdom has no MediaRecorder, getUserMedia,
// enumerateDevices or createObjectURL, so each is stubbed in this file.
import React from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  screenshot: "data:image/webp;base64,aGk=" as string | null,
  stream: {} as any,
  webcam: [] as any[],
  sw: { seconds: 0, minutes: 0, start: null as any, pause: null as any, reset: null as any },
}));

vi.mock("react-webcam", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef((p: any, ref: any) => {
      h.webcam.push(p);
      React.useImperativeHandle(ref, () => ({ getScreenshot: () => h.screenshot, stream: h.stream }));
      return <div data-testid="webcam" />;
    }),
  };
});
vi.mock("components/Home/UploadVideo", () => ({
  default: (p: any) => <div data-testid="video-preview">{p.vidUrl}</div>,
}));
vi.mock("react-timer-hook", () => ({ useStopwatch: () => ({ ...h.sw }) }));

import WebcamCapture from "components/Chat/components/CameraComponent";

class FakeRecorder {
  static last: FakeRecorder;
  state = "inactive";
  listeners: Record<string, any> = {};
  constructor(public stream: any, public options: any) {
    FakeRecorder.last = this;
  }
  addEventListener(ev: string, fn: any) {
    this.listeners[ev] = fn;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.listeners.dataavailable?.({ data: new Blob(["v"]) });
    this.listeners.dataavailable?.({ data: new Blob([]) });
  }
}

function media({ mic = true, cameras = 2, enumerateFails = false } = {}) {
  const track = { stop: vi.fn() };
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        if (!mic) throw new Error("no mic");
        return { getTracks: () => [track] };
      }),
      enumerateDevices: vi.fn(async () => {
        if (enumerateFails) throw new Error("no devices");
        return Array.from({ length: cameras }, () => ({ kind: "videoinput" }));
      }),
    },
  });
  return track;
}

async function mount() {
  const close = vi.fn();
  const send = vi.fn();
  const r = await renderWithProviders(<WebcamCapture imageFile={{ current: null }} close={close} send={send} />);
  const buttons = () => screen.getAllByRole("button");
  return { ...r, close, send, buttons };
}

/** The big round button in the middle of the control panel. */
const centre = (buttons: HTMLElement[]) => buttons[buttons.length - 2];
/** The close / discard button on the right of the control panel. */
const discard = (buttons: HTMLElement[]) => buttons[buttons.length - 1];

beforeEach(() => {
  h.screenshot = "data:image/webp;base64,aGk=";
  h.stream = {};
  h.webcam = [];
  h.sw = { seconds: 0, minutes: 0, start: vi.fn(), pause: vi.fn(), reset: vi.fn() };
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  (URL as any).createObjectURL = vi.fn(() => "blob:clip");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CameraComponent — photos", () => {
  it("takes a photo, previews it and sends it", async () => {
    media();
    const { buttons, send, close } = await mount();
    fireEvent.click(centre(buttons()));
    expect(screen.getByText("Preview Photo"), "the photo preview did not open").toBeInTheDocument();
    fireEvent.click(centre(buttons()));
    expect(send, "the photo was not sent").toHaveBeenCalledWith(h.screenshot);
    expect(close, "the camera did not close after sending").toHaveBeenCalled();
  });

  it("a failed screenshot keeps the camera open", async () => {
    media();
    h.screenshot = null;
    const { buttons } = await mount();
    fireEvent.click(centre(buttons()));
    expect(screen.queryByText("Preview Photo"), "an empty screenshot opened a preview").toBeNull();
  });

  it("discarding a preview returns to the camera, from either button", async () => {
    media();
    const { buttons, close } = await mount();
    fireEvent.click(centre(buttons()));
    fireEvent.click(discard(buttons()));
    expect(screen.getByTestId("webcam"), "discarding did not return to the camera").toBeInTheDocument();
    fireEvent.click(centre(buttons()));
    fireEvent.click(buttons()[0]);
    expect(screen.getByTestId("webcam"), "the back arrow did not discard the preview").toBeInTheDocument();
    expect(close, "discarding closed the camera").not.toHaveBeenCalled();
    fireEvent.click(buttons()[0]);
    fireEvent.click(discard(buttons()));
    expect(close, "the back arrow and close did not close the camera").toHaveBeenCalledTimes(2);
  });

  it("flips between the front and back camera when there are two", async () => {
    media({ cameras: 2 });
    const { buttons } = await mount();
    const flip = buttons()[3];
    await waitFor(() => expect(flip, "the flip button stayed disabled with two cameras").not.toBeDisabled());
    fireEvent.click(flip);
    expect(h.webcam.at(-1).videoConstraints.facingMode, "the camera did not flip to the back").toBe("environment");
    fireEvent.click(flip);
    expect(h.webcam.at(-1).videoConstraints.facingMode, "the camera did not flip back to the front").toBe("user");
  });

  it("disables the flip with one camera or when the cameras cannot be listed", async () => {
    media({ cameras: 1 });
    const a = await mount();
    await waitFor(() => expect(a.buttons()[3], "one camera left the flip enabled").toBeDisabled());
    a.unmount();
    media({ enumerateFails: true });
    const b = await mount();
    await waitFor(() => expect(b.buttons()[3], "a failed camera list left the flip enabled").toBeDisabled());
    b.unmount();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    const c = await mount();
    await waitFor(() => expect(c.buttons()[3], "no media devices left the flip enabled").toBeDisabled());
  });
});

describe("CameraComponent — video", () => {
  it("records with the mic, previews and sends the clip", async () => {
    const track = media();
    const { buttons, send, close } = await mount();
    fireEvent.click(screen.getByText("Video"));
    await waitFor(() => expect(h.webcam.at(-1).audio, "the mic was not turned on for video").toBe(true));
    expect(track.stop, "the mic test stream was not released").toHaveBeenCalled();
    fireEvent.click(centre(buttons()));
    expect(h.sw.start, "the recording clock did not start").toHaveBeenCalled();
    expect(screen.getByText("00:00"), "the recording time was not shown").toBeInTheDocument();
    act(() => {
      fireEvent.click(centre(buttons()));
    });
    expect(screen.getByTestId("video-preview").textContent, "the clip preview did not open").toBe("blob:clip");
    expect(screen.getByText("Preview Video"), "the preview title was not shown").toBeInTheDocument();
    fireEvent.click(centre(buttons()));
    const sent = send.mock.calls[0]?.[0] as File;
    expect(sent?.type, "the clip was not sent as a webm video").toBe("video/webm");
    expect(close, "the camera did not close after sending the clip").toHaveBeenCalled();
  });

  it("warns when there is no microphone and records without sound", async () => {
    media({ mic: false });
    await mount();
    fireEvent.click(screen.getByText("Video"));
    await waitFor(() =>
      expect(screen.getByText("Microphone not detected or permission denied"), "the missing mic was not shown").toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText("Photo"));
    expect(screen.queryByText("Microphone not detected or permission denied"), "the mic warning stayed on the photo tab").toBeNull();
  });

  it("does not record before the camera stream is there", async () => {
    media();
    h.stream = null;
    const { buttons } = await mount();
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(centre(buttons()));
    expect(h.sw.start, "recording started with no stream").not.toHaveBeenCalled();
  });

  it("discarding a clip returns to the camera, from either button", async () => {
    media();
    const { buttons } = await mount();
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(centre(buttons()));
    act(() => {
      fireEvent.click(centre(buttons()));
    });
    fireEvent.click(discard(buttons()));
    expect(screen.getByTestId("webcam"), "discard did not drop the clip").toBeInTheDocument();
    fireEvent.click(centre(buttons()));
    act(() => {
      fireEvent.click(centre(buttons()));
    });
    fireEvent.click(buttons()[0]);
    expect(screen.getByTestId("webcam"), "the back arrow did not drop the clip").toBeInTheDocument();
  });

  it("stops recording by itself at one minute", async () => {
    media();
    const r = await mount();
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(centre(r.buttons()));
    h.sw.seconds = 59;
    r.rerender(<WebcamCapture imageFile={{ current: null }} close={r.close} send={r.send} />);
    await waitFor(() => expect(h.sw.pause, "a one-minute recording was not stopped").toHaveBeenCalled());
    expect(FakeRecorder.last.state, "the recorder kept running past one minute").toBe("inactive");
  });
});
