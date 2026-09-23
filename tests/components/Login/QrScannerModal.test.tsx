// The profile page's QR scanner: it opens the back camera, reads frames into a
// canvas, and hands the first valid sign-in request id to the parent. jsdom has
// no camera, no canvas pixels and no animation frames, so all three are driven
// by hand here, and the QR decoder is replaced.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import QrScannerModal from "components/Login/QrScannerModal";

import { act, fireEvent, renderWithProviders, screen } from "../../render";

const jsQR = vi.fn();
vi.mock("jsqr", () => ({ default: (...a: any[]) => jsQR(...a) }));
const parseQrPayload = vi.fn();
vi.mock("services/qrLogin", () => ({ parseQrPayload: (...a: any[]) => parseQrPayload(...a) }));

const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] };
const getUserMedia = vi.fn();
let frames: FrameRequestCallback[] = [];
const cancelFrame = vi.fn();
let context: any;

/** Run every animation frame that is waiting, once. */
function runFrames() {
  const waiting = frames;
  frames = [];
  act(() => {
    waiting.forEach((cb) => cb(0));
  });
}

function videoReady(ready: boolean) {
  const video = document.querySelector("video") as HTMLVideoElement;
  Object.defineProperty(video, "readyState", { configurable: true, get: () => (ready ? 4 : 0) });
  Object.defineProperty(video, "videoWidth", { configurable: true, value: 10 });
  Object.defineProperty(video, "videoHeight", { configurable: true, value: 10 });
}

async function openScanner(props: any = {}) {
  const onDetected = vi.fn();
  const onClose = vi.fn();
  const view = await renderWithProviders(
    <QrScannerModal isRtl={false} language="en" onDetected={onDetected} onClose={onClose} {...props} />,
  );
  // Let the camera promise and play() settle.
  await act(async () => {});
  return { ...view, onDetected, onClose };
}

describe("QrScannerModal", () => {
  beforeEach(() => {
    frames = [];
    getUserMedia.mockReset();
    getUserMedia.mockResolvedValue(stream);
    stopTrack.mockReset();
    cancelFrame.mockReset();
    jsQR.mockReset();
    parseQrPayload.mockReset();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn(async () => {}),
    });
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    context = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(400) })),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens the back camera and shows the scan copy on the right side in LTR", async () => {
    await openScanner();
    expect(getUserMedia, "the back camera was not asked for").toHaveBeenCalledWith({
      video: { facingMode: "environment" },
      audio: false,
    });
    expect((document.querySelector("video") as HTMLVideoElement).srcObject, "the stream is not on the video").toBe(
      stream,
    );
    expect(screen.getByText("Scan to sign in"), "the title is missing").toBeInTheDocument();
    const close = document.querySelector('[data-pw="qr-scanner-close"]') as HTMLElement;
    expect(close.style.right, "the LTR close button is not on the right").toBe("20px");
  });

  it("puts the close button on the left in RTL, and closes", async () => {
    const { onClose } = await openScanner({ isRtl: true });
    const close = document.querySelector('[data-pw="qr-scanner-close"]') as HTMLElement;
    expect(close.style.left, "the RTL close button is not on the left").toBe("20px");
    fireEvent.click(close);
    expect(onClose, "the close button did not close").toHaveBeenCalled();
  });

  it("waits for video data and a 2D context, then hands over the first valid request id", async () => {
    const { onDetected } = await openScanner();
    // Not enough video data yet: it waits for the next frame.
    videoReady(false);
    runFrames();
    expect(frames.length, "a frame without video data did not ask for another").toBe(1);

    // Video is ready but the canvas gives no context: it waits again.
    videoReady(true);
    (HTMLCanvasElement.prototype.getContext as any).mockReturnValueOnce(null);
    runFrames();
    expect(frames.length, "a frame without a 2D context did not ask for another").toBe(1);

    // A frame with no QR code keeps scanning.
    jsQR.mockReturnValueOnce(null);
    runFrames();
    expect(parseQrPayload, "an empty frame was parsed").not.toHaveBeenCalled();

    // A QR code that is not a sign-in request keeps scanning.
    jsQR.mockReturnValueOnce({ data: "https://other.example" });
    parseQrPayload.mockReturnValueOnce(null);
    runFrames();
    expect(frames.length, "a foreign QR code stopped the scan").toBe(1);

    // A sign-in QR: the reticle turns green, the camera stops, and 180 ms later
    // the request id goes to the parent.
    vi.useFakeTimers();
    jsQR.mockReturnValueOnce({ data: "trydos://qr/abc" });
    parseQrPayload.mockReturnValueOnce("abc");
    runFrames();
    expect(document.querySelector(".qr-reticle")?.className, "the reticle did not show the hit").toContain("qr-hit");
    expect(stopTrack, "the camera was not stopped after the hit").toHaveBeenCalled();
    expect(onDetected, "the id was handed over before the hit animation").not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(onDetected, "the request id was not handed over").toHaveBeenCalledWith("abc");
  });

  it("stops the camera and cancels the frame when it closes", async () => {
    const { unmount } = await openScanner();
    stopTrack.mockReset();
    unmount();
    expect(cancelFrame, "the pending frame was not cancelled").toHaveBeenCalled();
    expect(stopTrack, "the camera kept running after closing").toHaveBeenCalled();
  });

  it("stops a camera that arrives after the scanner closed", async () => {
    let give: (s: any) => void = () => {};
    getUserMedia.mockReturnValue(new Promise((r) => (give = r)));
    const { unmount } = await renderWithProviders(
      <QrScannerModal isRtl={false} language="en" onDetected={vi.fn()} onClose={vi.fn()} />,
    );
    unmount();
    await act(async () => {
      give(stream);
    });
    expect(stopTrack, "a late camera was left running").toHaveBeenCalled();
  });

  it("says the camera is unavailable when it is refused", async () => {
    getUserMedia.mockRejectedValue(new Error("denied"));
    await openScanner();
    expect(
      screen.getByText("Camera unavailable — allow camera access to scan"),
      "a refused camera gave no message",
    ).toBeInTheDocument();
  });

  it("keeps quiet when the camera is refused after it closed", async () => {
    let refuse: (e: any) => void = () => {};
    getUserMedia.mockReturnValue(new Promise((_, r) => (refuse = r)));
    const { unmount } = await renderWithProviders(
      <QrScannerModal isRtl={false} language="en" onDetected={vi.fn()} onClose={vi.fn()} />,
    );
    unmount();
    await act(async () => {
      refuse(new Error("denied"));
    });
    expect(
      screen.queryByText("Camera unavailable — allow camera access to scan"),
      "a closed scanner showed a message",
    ).not.toBeInTheDocument();
  });
});
