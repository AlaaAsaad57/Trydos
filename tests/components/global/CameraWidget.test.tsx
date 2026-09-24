// The camera used by image search: take a photo, retake it, or use it.
import { forwardRef, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({
  notify: vi.fn(),
  logError: vi.fn(),
  screenshot: vi.fn(),
  errorName: "NotAllowedError",
}));
vi.mock("@/store/notifications/reducer", () => ({ showErrorNotification: spies.notify }));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: spies.logError,
}));
// jsdom has no camera. The stand-in hands back a fixed screenshot, shows the
// constraints it was given, and has a button that reports a camera failure.
vi.mock("react-webcam", () => ({
  default: forwardRef(function FakeWebcam(props: any, ref) {
    useImperativeHandle(ref, () => ({ getScreenshot: spies.screenshot }));
    return (
      <div data-constraints={JSON.stringify(props.videoConstraints)}>
        <button onClick={() => props.onUserMediaError({ name: spies.errorName })}>camera fails</button>
      </div>
    );
  }),
}));

import { CameraWidget } from "components/global/CameraWidget";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const setCameras = (kinds: string[] | "broken") => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value:
      kinds === "broken"
        ? undefined
        : { enumerateDevices: vi.fn().mockResolvedValue(kinds.map((kind) => ({ kind }))) },
  });
};

const constraints = () =>
  JSON.parse(document.querySelector("[data-constraints]")?.getAttribute("data-constraints") || "{}");

const setup = async (kinds: string[] | "broken" = ["videoinput"]) => {
  setCameras(kinds);
  const onCapture = vi.fn();
  const onClose = vi.fn();
  const result = await renderWithProviders(<CameraWidget onCapture={onCapture} onClose={onClose} />);
  return { onCapture, onClose, ...result };
};

beforeEach(() => {
  spies.notify.mockClear();
  spies.logError.mockClear();
  spies.screenshot.mockReset();
  spies.screenshot.mockReturnValue("data:image/jpeg;base64,shot");
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the camera widget", () => {
  it("offers the camera switch only when there is more than one camera, and flips the facing mode", async () => {
    await setup(["videoinput", "videoinput", "audioinput"]);
    const toggle = await screen.findByRole("button", { name: "Switch camera" });
    expect(constraints().facingMode, "the back camera must be used first").toBe("environment");

    await userEvent.click(toggle);
    expect(constraints().facingMode, "the switch must move to the front camera").toBe("user");
    await userEvent.click(toggle);
    expect(constraints().facingMode, "a second switch must move back to the back camera").toBe("environment");
  });

  it("hides the switch with one camera", async () => {
    await setup(["videoinput"]);
    await waitFor(() => expect(navigator.mediaDevices.enumerateDevices, "the cameras must be counted").toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Switch camera" }), "one camera must not offer a switch").toBeNull();
  });

  it("logs it when the cameras cannot be counted", async () => {
    await setup("broken");
    await waitFor(() =>
      expect(spies.logError.mock.calls[0]?.[0]?.scenario, "a failed camera count must be logged").toBe(
        "Error checking cameras in CheckCamera function in CameraWidget",
      ),
    );
  });

  it("takes a photo, retakes it, and hands the used photo on as a jpeg file", async () => {
    const onScreen = await setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(["jpg"], { type: "image/jpeg" })) }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Capture photo" }));
    expect(screen.getByAltText("Captured"), "the taken photo must be shown").toHaveAttribute(
      "src",
      "data:image/jpeg;base64,shot",
    );

    await userEvent.click(screen.getByText("Retake"));
    expect(screen.queryByAltText("Captured"), "retake must go back to the live camera").toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Capture photo" }));
    await userEvent.click(screen.getByText("Use Photo"));
    await waitFor(() => expect(onScreen.onCapture, "the used photo must be handed on").toHaveBeenCalled());
    const file = onScreen.onCapture.mock.calls[0][0] as File;
    expect(file.name, "the photo file must be named camera-capture.jpg").toBe("camera-capture.jpg");
    expect(file.type, "the photo file must be a jpeg").toBe("image/jpeg");
  });

  it("shows an error when the photo cannot be turned into a file", async () => {
    const onScreen = await setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("bad data")));

    await userEvent.click(screen.getByRole("button", { name: "Capture photo" }));
    await userEvent.click(screen.getByText("Use Photo"));
    await waitFor(() =>
      expect(spies.notify, "a failed photo must be reported to the shopper").toHaveBeenCalledWith("Failed to process image"),
    );
    expect(onScreen.onCapture, "a failed photo must not be handed on").not.toHaveBeenCalled();
  });

  it("stays on the live camera when the camera gives no screenshot", async () => {
    await setup();
    spies.screenshot.mockReturnValue(null);
    await userEvent.click(screen.getByRole("button", { name: "Capture photo" }));
    expect(screen.queryByAltText("Captured"), "with no screenshot there is nothing to show").toBeNull();
  });

  it("closes on the cross and on cancel", async () => {
    const { onClose } = await setup();
    await userEvent.click(screen.getByRole("button", { name: "Close camera" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose, "both the cross and cancel must close the camera").toHaveBeenCalledTimes(2);
  });

  it("falls back to smaller constraints when the camera refuses the first ones", async () => {
    const { onClose } = await setup();
    spies.errorName = "OverconstrainedError";
    await userEvent.click(screen.getByText("camera fails"));

    expect(constraints().width, "the fallback must ask for 1280 x 720 at most").toEqual({ ideal: 1280, min: 640 });
    expect(spies.notify, "the shopper must be told the fallback is tried").toHaveBeenCalledWith(
      "Camera constraints not supported, trying fallback settings",
    );
    expect(onClose, "a constraint problem must not close the camera").not.toHaveBeenCalled();
  });

  it.each([
    ["NotAllowedError", "Camera access denied"],
    ["NotFoundError", "No camera found"],
    ["AbortError", "Camera error occurred"],
  ])("on %s says '%s' and closes", async (name, message) => {
    const { onClose } = await setup();
    spies.errorName = name;
    await userEvent.click(screen.getByText("camera fails"));

    expect(spies.notify, `a ${name} must be explained to the shopper`).toHaveBeenCalledWith(message);
    expect(onClose, `a ${name} must close the camera`).toHaveBeenCalled();
    expect(spies.logError.mock.calls.at(-1)?.[0]?.scenario, "every camera failure must be logged").toBe(
      "CameraWidget: the camera failed",
    );
  });
});
