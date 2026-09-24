// The editor a picture goes through before upload: crop, rotate, save.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// react-image-crop needs real layout to drag a box. The stand-in draws the
// picture and offers two buttons that report a crop, the way a drag would.
vi.mock("react-image-crop", () => ({
  default: ({ onChange, children }: any) => (
    <div>
      {children}
      <button onClick={() => onChange({ unit: "px", width: 50, height: 40, x: 10, y: 5 })}>pixel crop</button>
      <button onClick={() => onChange({ unit: "%", width: 50, height: 50, x: 10, y: 20 })}>percent crop</button>
    </div>
  ),
}));

import { ImageCropWidget } from "components/global/ImageCropWidget";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

// jsdom has no canvas. A fake 2D context records what was drawn.
const ctx = { translate: vi.fn(), rotate: vi.fn(), drawImage: vi.fn() };
let blob: Blob | null = new Blob(["x"], { type: "image/jpeg" });

beforeEach(() => {
  ctx.translate.mockClear();
  ctx.rotate.mockClear();
  ctx.drawImage.mockClear();
  blob = new Blob(["x"], { type: "image/jpeg" });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as any);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,rotated");
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (cb: BlobCallback) {
    cb(blob);
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

const photo = new File(["pixels"], "photo.png", { type: "image/png" });

const setup = async () => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  await renderWithProviders(<ImageCropWidget image={photo} onSave={onSave} onClose={onClose} />);
  const img = screen.getByAltText("Upload") as HTMLImageElement;
  // Drawn at 100 x 80, the real picture is 200 x 160, so every crop scales by 2.
  Object.defineProperty(img, "width", { value: 100 });
  Object.defineProperty(img, "height", { value: 80 });
  Object.defineProperty(img, "naturalWidth", { value: 200 });
  Object.defineProperty(img, "naturalHeight", { value: 160 });
  return { onSave, onClose, img };
};

const save = () => fireEvent.click(document.querySelector('[data-pw="image-crop-save-button"]') as HTMLElement);

describe("the image crop editor", () => {
  it("shows the chosen picture and closes on the cross", async () => {
    const { onClose, img } = await setup();
    await waitFor(() =>
      expect(img.getAttribute("src"), "the chosen picture must be read and shown").toMatch(/^data:image\/png;base64,/),
    );
    fireEvent.click(screen.getByText("✕"));
    expect(onClose, "the cross must close the editor").toHaveBeenCalled();
  });

  it("saves the original file untouched when nothing was cropped or rotated", async () => {
    const { onSave } = await setup();
    save();
    expect(onSave, "an untouched picture must be saved as the original file").toHaveBeenCalledWith(photo);
    expect(ctx.drawImage, "an untouched picture must not be redrawn").not.toHaveBeenCalled();
  });

  it("cuts a pixel crop out of the full-size picture", async () => {
    const { onSave } = await setup();
    fireEvent.click(screen.getByText("pixel crop"));
    save();

    expect(ctx.drawImage.mock.calls[0].slice(1), "the crop must be scaled from the drawn size to the real size").toEqual([
      20, 10, 100, 80, 0, 0, 100, 80,
    ]);
    const saved = onSave.mock.calls[0][0] as File;
    expect(saved.name, "the cropped file must keep the original name").toBe("photo.png");
    expect(saved.type, "the cropped file must be a jpeg").toBe("image/jpeg");
  });

  it("cuts a percent crop out of the full-size picture", async () => {
    await setup();
    fireEvent.click(screen.getByText("percent crop"));
    save();
    expect(ctx.drawImage.mock.calls[0].slice(1), "a percent crop must be turned into real pixels").toEqual([
      20, 32, 100, 80, 0, 0, 100, 80,
    ]);
  });

  it("rotates the picture both ways, and then saves a redrawn copy", async () => {
    const { onSave, img } = await setup();

    fireEvent.click(screen.getByTitle("Rotate left"));
    expect(ctx.rotate, "rotate left must turn a quarter turn anticlockwise").toHaveBeenCalledWith(-Math.PI / 2);
    expect(img.getAttribute("src"), "the rotated picture must replace the shown one").toBe("data:image/jpeg;base64,rotated");

    fireEvent.click(screen.getByTitle("Rotate right"));
    expect(ctx.rotate, "rotate right must turn a quarter turn clockwise").toHaveBeenLastCalledWith(Math.PI / 2);

    ctx.drawImage.mockClear();
    save();
    expect(ctx.drawImage, "a rotated picture must be redrawn on save, not saved as the original").toHaveBeenCalled();
    expect(onSave.mock.calls[0][0], "a rotated picture must not be saved as the original file").not.toBe(photo);
  });

  it("saves nothing when the canvas gives no picture back", async () => {
    const { onSave } = await setup();
    blob = null;
    fireEvent.click(screen.getByText("pixel crop"));
    save();
    expect(onSave, "with no picture from the canvas nothing must be saved").not.toHaveBeenCalled();
  });

  it("does nothing when the browser has no 2D canvas", async () => {
    const { onSave, img } = await setup();
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const before = img.getAttribute("src");

    act(() => {
      fireEvent.click(screen.getByTitle("Rotate left"));
    });
    expect(img.getAttribute("src"), "with no canvas the picture must stay as it was").toBe(before);

    fireEvent.click(screen.getByText("pixel crop"));
    save();
    expect(onSave, "with no canvas nothing must be saved").not.toHaveBeenCalled();
  });
});
