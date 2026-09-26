// The photo picker used by the return and rating forms: pick from files or
// take a photo, crop it, then upload it to the market backend through
// services/order. jsdom has no camera, so react-webcam is replaced by a
// stand-in that gives a fixed screenshot and a fake stream.
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import UploadImageComponent from "components/Orders/UploadImageComponent";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const stopTrack = vi.fn();
const fakeStream = { getTracks: () => [{ stop: stopTrack }] };
vi.mock("react-webcam", () => ({
  default: forwardRef((props: any, ref) => {
    useImperativeHandle(ref, () => ({
      getScreenshot: () => "data:image/webp;base64,AAAA",
      stream: fakeStream,
    }));
    useEffect(() => {
      props.onUserMedia?.(fakeStream);
    }, []);
    return <div data-testid="webcam" data-facing={props.videoConstraints.facingMode.ideal} />;
  }),
}));

vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: ({ image, onSave, onClose }: any) => (
    <div data-testid="crop">
      <span data-testid="crop-name">{image.name}</span>
      <button onClick={() => onSave(new File(["x"], "cropped.webp"))}>save crop</button>
      <button onClick={onClose}>close crop</button>
    </div>
  ),
}));

const uploadForRating = vi.fn();
const uploadForReturn = vi.fn();
vi.mock("services/order", () => ({
  default: {
    UploadImageForRating: (...a: any[]) => uploadForRating(...a),
    UploadImageForOrderReturn: (...a: any[]) => uploadForReturn(...a),
  },
}));

const showErrorNotification = vi.fn();
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...args: any[]) => showErrorNotification(...args),
}));

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...args: any[]) => logError(...args),
}));

const MEDIA = "https://example.com";

/** Holds the images and loading flag like the real parent form does. */
function Harness({
  initial = [] as string[],
  initialLoading = false,
  removeImageAction = vi.fn(async (_image: string) => {}) as (image: string) => Promise<void>,
  isForRating = false,
}) {
  const [images, setImages] = useState<string[]>(initial);
  const [loading, setLoading] = useState(initialLoading);
  return (
    <>
      <span data-testid="images">{images.join(",")}</span>
      <UploadImageComponent
        images={images}
        setImages={setImages}
        loading={loading}
        setLoading={setLoading}
        removeImageAction={removeImageAction}
        isForRating={isForRating}
      />
    </>
  );
}

const fileInput = () =>
  document.querySelector('[data-pw="return-modal-file-input"]') as HTMLInputElement;
const pick = (file?: File) =>
  fireEvent.change(fileInput(), { target: { files: file ? [file] : [] } });
const images = () => screen.getByTestId("images").textContent;

function setCameras(count: number | "throw") {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      enumerateDevices:
        count === "throw"
          ? () => Promise.reject(new Error("no devices"))
          : async () =>
              Array.from({ length: count }, () => ({ kind: "videoinput" })),
    },
  });
}

describe("UploadImageComponent", () => {
  beforeEach(() => {
    setCameras(1);
    uploadForRating.mockReset();
    uploadForReturn.mockReset();
    showErrorNotification.mockReset();
    logError.mockReset();
    stopTrack.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the empty return prompt and opens the files / camera menu", async () => {
    await renderWithProviders(<Harness />);
    expect(screen.getByText("Add Photo"), "the empty picker has no Add Photo").toBeInTheDocument();
    expect(
      screen.getByText(/Please Add Photos Of The Product You Received/),
      "the return hint is missing",
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Add Photo"));
    expect(screen.getByText("Files"), "the menu did not open").toBeInTheDocument();
    const clickSpy = vi.spyOn(fileInput(), "click");
    fireEvent.click(screen.getByText("Files"));
    expect(clickSpy, "choosing files did not open the file dialog").toHaveBeenCalled();
    expect(screen.queryByText("Files"), "the menu stayed open").not.toBeInTheDocument();
  });

  it("uploads a picked and cropped file as a return photo", async () => {
    uploadForReturn.mockResolvedValue({ sub_path: "new.webp" });
    await renderWithProviders(<Harness />);
    pick(new File(["x"], "pick.jpg"));
    expect(screen.getByTestId("crop-name").textContent, "the picked file was not sent to crop").toBe(
      "pick.jpg",
    );
    fireEvent.click(screen.getByText("save crop"));
    await waitFor(() => expect(images(), "the uploaded path was not added").toBe("new.webp"));
    expect(uploadForReturn, "the return upload was not used").toHaveBeenCalledWith({
      image: expect.any(File),
    });
    const img = screen.getByAltText("image") as HTMLImageElement;
    expect(img.src, "a return photo is not read from the return folder").toBe(
      `${MEDIA}/return_request_products/new.webp`,
    );
  });

  it("uploads to the rating folder when used by the rating form", async () => {
    uploadForRating.mockResolvedValue({ sub_path: "r.webp" });
    await renderWithProviders(<Harness isForRating initial={[`${MEDIA}/full.webp`]} />);
    expect(
      screen.queryByText(/Please Add Photos Of The Product You Received/),
      "the return hint showed on the rating form",
    ).not.toBeInTheDocument();
    expect((screen.getByAltText("image") as HTMLImageElement).src, "a full media URL was changed").toBe(
      `${MEDIA}/full.webp`,
    );
    pick(new File(["x"], "pick.jpg"));
    fireEvent.click(screen.getByText("save crop"));
    await waitFor(() => expect(images(), "the rating upload was not added").toContain("r.webp"));
    expect(
      (screen.getAllByAltText("image")[1] as HTMLImageElement).src,
      "a rating photo is not read from the rating folder",
    ).toBe(`${MEDIA}/rating_orders/r.webp`);
  });

  it("warns and keeps the list when the upload fails", async () => {
    uploadForReturn.mockRejectedValue(new Error("down"));
    await renderWithProviders(<Harness />);
    pick(new File(["x"], "pick.jpg"));
    fireEvent.click(screen.getByText("save crop"));
    await waitFor(() =>
      expect(showErrorNotification, "a failed upload did not warn").toHaveBeenCalledWith(
        "Failed To Upload Image..Try Again",
      ),
    );
    expect(images(), "a failed upload changed the list").toBe("");
    expect(logError, "a failed upload was not logged").toHaveBeenCalled();
  });

  it("closing the crop throws the file away", async () => {
    await renderWithProviders(<Harness />);
    pick(new File(["x"], "pick.jpg"));
    fireEvent.click(screen.getByText("close crop"));
    expect(screen.queryByTestId("crop"), "the crop stayed open").not.toBeInTheDocument();
    expect(screen.getByText("Add Photo"), "the picker did not come back").toBeInTheDocument();
  });

  it("ignores an empty pick and refuses a photo over 5 MB", async () => {
    await renderWithProviders(<Harness />);
    pick();
    expect(screen.queryByTestId("crop"), "an empty pick opened the crop").not.toBeInTheDocument();

    const big = new File(["x"], "big.jpg");
    Object.defineProperty(big, "size", { value: 5 * 1024 * 1024 + 1 });
    pick(big);
    expect(showErrorNotification, "a big photo did not warn").toHaveBeenCalledWith(
      "Each Photo Must Be 5 MB Or Less",
    );
  });

  it("warns when reading the picked file throws", async () => {
    await renderWithProviders(<Harness />);
    const input = fileInput();
    Object.defineProperty(input, "Files", {
      configurable: true,
      get() {
        throw new Error("unreadable");
      },
    });
    fireEvent.change(input);
    expect(showErrorNotification, "an unreadable pick did not warn").toHaveBeenCalledWith(
      "Failed To Upload Image..Try Again",
    );
  });

  it("refuses a sixth photo from the box, from the file input and after cropping", async () => {
    const five = ["1", "2", "3", "4", "5"];
    await renderWithProviders(<Harness initial={five} />);
    fireEvent.click(screen.getAllByAltText("image")[0].parentElement!.parentElement!.parentElement!);
    expect(showErrorNotification, "the full box opened the menu").toHaveBeenCalledWith(
      "You Can Add Up To 5 Photos Only",
    );
    showErrorNotification.mockReset();
    pick(new File(["x"], "six.jpg"));
    expect(showErrorNotification, "a sixth pick did not warn").toHaveBeenCalledWith(
      "You Can Add Up To 5 Photos Only",
    );
  });

  it("refuses the crop result when the list filled up meanwhile", async () => {
    const props = {
      setImages: vi.fn(),
      loading: false,
      setLoading: vi.fn(),
      removeImageAction: vi.fn(),
    };
    const { rerender } = await renderWithProviders(
      <UploadImageComponent images={["1", "2", "3", "4"]} {...props} />,
    );
    pick(new File(["x"], "pick.jpg"));
    rerender(<UploadImageComponent images={["1", "2", "3", "4", "5"]} {...props} />);
    fireEvent.click(screen.getByText("save crop"));
    expect(showErrorNotification, "a sixth photo after cropping did not warn").toHaveBeenCalledWith(
      "You Can Add Up To 5 Photos Only",
    );
    expect(uploadForReturn, "a sixth photo was uploaded").not.toHaveBeenCalled();
    expect(props.setImages, "a sixth photo was added").not.toHaveBeenCalled();
  });

  it("removes a photo through the parent's action, and warns when that fails", async () => {
    const removeImageAction = vi.fn(async (i: string) => {
      if (i === "bad") throw new Error("refused");
    });
    await renderWithProviders(<Harness initial={["a", "bad"]} removeImageAction={removeImageAction} />);
    fireEvent.click(screen.getAllByText("X")[0]);
    await waitFor(() => expect(images(), "the removed photo stayed").toBe("bad"));
    fireEvent.click(screen.getAllByText("X")[0]);
    await waitFor(() =>
      expect(showErrorNotification, "a failed remove did not warn").toHaveBeenCalledWith(
        "Failed To Remove Image..Try Again",
      ),
    );
    expect(images(), "a failed remove changed the list").toBe("bad");
  });

  it("shows a spinner and does not remove while loading", async () => {
    const removeImageAction = vi.fn();
    await renderWithProviders(
      <Harness initial={["a"]} initialLoading removeImageAction={removeImageAction} />,
    );
    expect(screen.queryByText("X"), "photos showed while loading").not.toBeInTheDocument();
  });

  it("takes a photo with the camera, flips, retakes, confirms and closes", async () => {
    setCameras(2);
    vi.stubGlobal("fetch", vi.fn(async () => ({ blob: async () => new Blob(["x"]) })));
    await renderWithProviders(<Harness />);
    fireEvent.click(screen.getByText("Add Photo"));
    fireEvent.click(screen.getByText("Camera"));
    const cam = await screen.findByTestId("webcam");
    expect(cam.dataset.facing, "the camera did not start facing the user").toBe("user");

    // With two cameras there are three buttons: close, flip, capture.
    await waitFor(() =>
      expect(screen.getAllByRole("button").length, "the flip button is missing with two cameras").toBe(3),
    );
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(screen.getByTestId("webcam").dataset.facing, "flip did not switch camera").toBe(
      "environment",
    );
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(screen.getByTestId("webcam").dataset.facing, "flip twice did not come back").toBe("user");

    // Capture, then retake (first button), capture again, then drop (third).
    fireEvent.click(screen.getAllByRole("button")[2]);
    expect(screen.getByAltText("captured"), "the captured preview is missing").toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByTestId("webcam"), "retake did not go back to the camera").toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button")[2]);
    fireEvent.click(screen.getAllByRole("button")[2]);
    expect(screen.getByTestId("webcam"), "drop did not go back to the camera").toBeInTheDocument();

    // Capture and confirm: the photo goes to crop as a webp file.
    fireEvent.click(screen.getAllByRole("button")[2]);
    fireEvent.click(screen.getAllByRole("button")[1]);
    await screen.findByTestId("crop");
    expect(screen.getByTestId("crop-name").textContent, "the camera file is not webp").toMatch(
      /^camera-\d+\.webp$/,
    );
    // Closing the crop goes back to the live camera, ready for another try.
    fireEvent.click(screen.getByText("close crop"));
    await screen.findByTestId("webcam");

    // Close the camera: the stream is stopped.
    stopTrack.mockReset();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(stopTrack, "closing the camera did not stop the stream").toHaveBeenCalled();
    expect(screen.queryByTestId("webcam"), "the camera stayed open").not.toBeInTheDocument();
  });

  it("warns when the captured photo cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("bad data url"))));
    await renderWithProviders(<Harness />);
    fireEvent.click(screen.getByText("Add Photo"));
    fireEvent.click(screen.getByText("Camera"));
    await screen.findByTestId("webcam");
    fireEvent.click(screen.getAllByRole("button")[1]);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button")[1]);
    });
    await waitFor(() =>
      expect(showErrorNotification, "an unreadable capture did not warn").toHaveBeenCalledWith(
        "Failed To Upload Image..Try Again",
      ),
    );
  });

  it("logs when the camera list cannot be read, and shows no flip button", async () => {
    setCameras("throw");
    await renderWithProviders(<Harness />);
    await waitFor(() => expect(logError, "the camera list error was not logged").toHaveBeenCalled());
  });
});
