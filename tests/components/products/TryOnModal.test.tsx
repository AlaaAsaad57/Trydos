// The virtual try-on modal: the shopper adds a photo (camera or file), presses
// Try On, waits, and sees the result. jsdom has no camera, no canvas drawing and
// no video playback, so those three are stubbed in this file.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TryOnModal from "components/products/TryOnModal";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => logError(...a),
}));

const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] };
const getUserMedia = vi.fn();
const play = vi.fn();

function openModal(extra: any = {}) {
  const onClose = vi.fn();
  return renderWithProviders(<TryOnModal isOpen onClose={onClose} language="en" {...extra} />, {
    store: { isModalOpen: { images: [{ file_path: "/a.jpg" }, "/b.jpg"] } },
  }).then((view) => ({ ...view, onClose }));
}

async function pickFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [new File(["x"], "me.png", { type: "image/png" })] },
  });
  return screen.findByAltText("Selected");
}

describe("TryOnModal", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    getUserMedia.mockReset();
    getUserMedia.mockResolvedValue(stream);
    stopTrack.mockReset();
    logError.mockReset();
    play.mockReset();
    play.mockResolvedValue(undefined);
    Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: play });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as any);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,CAP");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders nothing when closed", async () => {
    const { container } = await renderWithProviders(
      <TryOnModal isOpen={false} onClose={vi.fn()} language="en" />,
    );
    expect(container.innerHTML, "a closed modal rendered markup").toBe("");
  });

  it("shows the product images and hides the product video while open", async () => {
    const video = document.createElement("div");
    video.className = "product-video";
    document.body.appendChild(video);
    const { unmount } = await openModal();
    expect(video.style.display, "the product video was not hidden").toBe("none");
    const imgs = screen.getAllByAltText("tryon-product-image");
    expect(imgs.map((i) => i.getAttribute("src")).join(" "), "the product images are missing").toMatch(
      /a\.jpg.*b\.jpg/,
    );
    unmount();
    expect(video.style.display, "the product video was not shown again").toBe("flex");
    video.remove();
  });

  it("uploads a photo, tries it on after 3 seconds, and tries again", async () => {
    await openModal();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
    fireEvent.click(screen.getByText("Upload Photo"));
    expect(clickSpy, "Upload Photo did not open the file dialog").toHaveBeenCalled();

    // An empty pick changes nothing.
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [] },
    });
    expect(screen.getByText("Upload Photo"), "an empty pick left the choice screen").toBeInTheDocument();

    const preview = await pickFile();
    expect(preview.getAttribute("src"), "the preview is not the picked photo").toMatch(/^data:image\/png/);

    vi.useFakeTimers();
    fireEvent.click(screen.getByText("Try On"));
    expect(screen.getByText("Processing…"), "no processing state").toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByAltText("Result"), "no result after 3 seconds").toBeInTheDocument();
    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText("Upload Photo"), "try again did not go back to the choice").toBeInTheDocument();
  });

  it("the preview's try again goes back to the choice", async () => {
    await openModal();
    await pickFile();
    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText("Take Photo"), "try again from preview did not reset").toBeInTheDocument();
  });

  it("closes from the result screen and from the backdrop", async () => {
    const { onClose } = await openModal();
    await pickFile();
    vi.useFakeTimers();
    fireEvent.click(screen.getByText("Try On"));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByText("Close"));
    expect(onClose, "Close on the result did not close").toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector(".backdrop-blur-xs") as HTMLElement);
    expect(onClose, "the backdrop did not close").toHaveBeenCalledTimes(2);
  });

  it("closes on Escape", async () => {
    const { onClose } = await openModal();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose, "a key other than Escape closed").not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose, "Escape did not close").toHaveBeenCalled();
  });

  it("does not close from the button while processing", async () => {
    const { onClose } = await openModal();
    await pickFile();
    vi.useFakeTimers();
    fireEvent.click(screen.getByText("Try On"));
    fireEvent.click(document.querySelector(".backdrop-blur-xs") as HTMLElement);
    expect(onClose, "the backdrop closed while processing").not.toHaveBeenCalled();
  });

  // BUG-products-2: the Escape listener is registered once per `isOpen`
  // (TryOnModal.tsx line 31-56) and keeps the first `handleClose`, which saw
  // isProcessing=false. So Escape closes the modal during processing, which the
  // guard on line 22 is meant to stop.
  it("BUG-products-2: Escape must not close the modal while the try-on is processing", async () => {
    const { onClose } = await openModal();
    await pickFile();
    vi.useFakeTimers();
    fireEvent.click(screen.getByText("Try On"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose, "Escape closed the modal while it was processing").not.toHaveBeenCalled();
  });

  it("takes a photo with the camera and stops the stream", async () => {
    await openModal();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(getUserMedia, "the back camera was not asked for").toHaveBeenCalledWith({
      video: { facingMode: "environment" },
    });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.srcObject, "the stream was not attached to the video").toBe(stream);
    expect(play, "the preview did not start playing").toHaveBeenCalled();
    fireEvent(video, new Event("loadedmetadata"));
    expect(play, "the loaded video did not play").toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText("Capture Photo"));
    expect(stopTrack, "capturing did not stop the camera").toHaveBeenCalled();
    expect(screen.getByAltText("Selected").getAttribute("src"), "the capture is not the preview").toBe(
      "data:image/jpeg;base64,CAP",
    );
  });

  it("does nothing on capture when the canvas has no 2D context", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    await openModal();
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    fireEvent.click(await screen.findByText("Capture Photo"));
    expect(screen.getByText("Capture Photo"), "capture left the camera without a picture").toBeInTheDocument();
  });

  it("cancels the camera, and logs when the video will not play", async () => {
    play.mockRejectedValue(new Error("blocked"));
    await openModal();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    fireEvent(document.querySelector("video") as HTMLVideoElement, new Event("loadedmetadata"));
    await waitFor(() =>
      expect(logError, "the blocked play was not logged twice").toHaveBeenCalledTimes(2),
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(stopTrack, "cancel did not stop the camera").toHaveBeenCalled();
    expect(screen.getByText("Take Photo"), "cancel did not go back").toBeInTheDocument();
  });

  it("does not attach the stream when the modal closed before the timer", async () => {
    await openModal();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    fireEvent.click(screen.getByText("Cancel"));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(play, "a stopped camera still played").not.toHaveBeenCalled();
  });

  it("alerts when the camera is refused", async () => {
    getUserMedia.mockRejectedValue(new Error("denied"));
    const alert = vi.fn();
    vi.stubGlobal("alert", alert);
    await openModal();
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(alert, "a refused camera did not alert").toHaveBeenCalled();
  });

  // BUG-products-1: TryOnModal.tsx line 96-100. When the camera is refused, the
  // alert asks for NOTIFICATION permission. The shopper must allow the camera,
  // not notifications, so the message sends them to the wrong setting.
  it("BUG-products-1: a refused camera must ask for camera permission, not notification permission", async () => {
    getUserMedia.mockRejectedValue(new Error("denied"));
    const alert = vi.fn();
    vi.stubGlobal("alert", alert);
    await openModal();
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(String(alert.mock.calls[0]?.[0]), "the camera alert talks about notifications").not.toMatch(
      /notification/i,
    );
  });
});
