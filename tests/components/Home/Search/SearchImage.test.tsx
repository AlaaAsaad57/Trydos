import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: ({ image, onSave, onClose }: any) => (
    <div data-testid="crop" data-name={image?.name}>
      <button onClick={() => onSave(image)}>save crop</button>
      <button onClick={onClose}>close crop</button>
    </div>
  ),
}));
vi.mock("components/global/CameraWidget", () => ({
  CameraWidget: ({ onCapture, onClose }: any) => (
    <div data-testid="camera">
      <button onClick={() => onCapture(new File(["x"], "shot.png", { type: "image/png" }))}>capture</button>
      <button onClick={onClose}>close camera</button>
    </div>
  ),
}));

const showErrorNotification = vi.fn();
vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));
const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => LogError(...a),
}));

import SearchImage from "components/Home/Search/SearchImage";

const camIcon = () => document.querySelector('img[src="/icons/SearchCamIcon.svg"]') as HTMLImageElement;
const fileInputs = () => Array.from(document.body.querySelectorAll('input[type="file"].opacity-0')) as HTMLInputElement[];
const setAgent = (ua: string) => Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });

/** Pick a file through the hidden input the component made. */
const choose = (input: HTMLInputElement, file: File | undefined) => {
  const target = { files: [file], value: "C:\\fake" };
  act(() => {
    (input.onchange as any)({ target });
  });
  return target;
};

const png = () => new File(["x"], "pic.png", { type: "image/png" });

describe("SearchImage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("alert", vi.fn());
    showErrorNotification.mockReset();
    LogError.mockReset();
    fileInputs().forEach((i) => i.remove());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window.navigator as any).userAgent;
  });

  it("on desktop: opens a menu, and the file option opens a file picker", async () => {
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    const fromFiles = screen.getByLabelText("Choose file from device");
    fireEvent.click(fromFiles);
    expect(screen.queryByLabelText("Choose file from device"), "the menu stayed open after a pick").toBeNull();
    expect(fileInputs().length, "no file picker was opened").toBe(1);
    expect(fileInputs()[0].onblur!(new FocusEvent("blur")), "the picker's blur handler should do nothing").toBeUndefined();
  });

  it("on desktop: the camera option opens the camera, and a shot goes to the crop step", async () => {
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    fireEvent.click(screen.getByLabelText("Take photo with camera"));
    fireEvent.click(screen.getByText("close camera"));
    expect(screen.queryByTestId("camera"), "the camera did not close").toBeNull();
    fireEvent.click(camIcon());
    fireEvent.click(screen.getByLabelText("Take photo with camera"));
    fireEvent.click(screen.getByText("capture"));
    expect(screen.queryByTestId("camera"), "the camera stayed open after a shot").toBeNull();
    expect(screen.getByTestId("crop").dataset.name, "the shot did not go to the crop step").toBe("shot.png");
  });

  it("closes the menu on a click outside, but not on a click inside", async () => {
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.mouseDown(document.body);
    fireEvent.click(camIcon());
    fireEvent.mouseDown(screen.getByLabelText("Take photo with camera"));
    expect(screen.getByLabelText("Take photo with camera"), "a click inside closed the menu").toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByLabelText("Take photo with camera"), "a click outside did not close the menu").toBeNull();
  });

  it.each([
    ["an iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile"],
    ["an iPad", "Mozilla/5.0 (iPad; CPU OS 17_0)"],
  ])("on %s: opens the file picker straight away", async (_name, ua) => {
    setAgent(ua);
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    expect(screen.queryByLabelText("Take photo with camera"), "a phone or tablet got the desktop menu").toBeNull();
    expect(fileInputs().length, "no file picker was opened").toBe(1);
    expect(fileInputs()[0].onblur!(new FocusEvent("blur")), "the picker's blur handler should do nothing").toBeUndefined();
  });

  it("refuses a file that is not a picture and clears the picker", async () => {
    setAgent("android mobile");
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    const target = choose(fileInputs()[0], new File(["x"], "a.pdf", { type: "application/pdf" }));
    expect(window.alert, "a wrong file type was not refused").toHaveBeenCalledWith(
      "please select supported image format (jpeg, png, jpg, webp, svg, avif)",
    );
    expect(target.value, "the refused file was left in the picker").toBeNull();
    expect(screen.queryByTestId("crop"), "a refused file reached the crop step").toBeNull();
    expect(camIcon(), "the spinner stayed after a refused file").not.toBeNull();
  });

  it("sends the cropped picture to image search and fills the search box with the answer", async () => {
    setAgent("android mobile");
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ response: "black t-shirt" }) });
    const setSearchValue = vi.fn();
    await renderWithProviders(<SearchImage setSearchValue={setSearchValue} />);
    fireEvent.click(camIcon());
    choose(fileInputs()[0], png());
    expect(screen.getByTestId("crop").dataset.name, "a good picture did not reach the crop step").toBe("pic.png");
    await act(async () => fireEvent.click(screen.getByText("save crop")));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url, "the picture went to the wrong address").toBe("/api/image-search");
    expect((init.body as FormData).get("language"), "the language was not sent").toBe("en");
    expect(init.credentials, "image search must not send cookies").toBe("omit");
    await waitFor(() => expect(setSearchValue, "the answer did not fill the search box").toHaveBeenCalledWith("black t-shirt"));
    expect(camIcon(), "the spinner stayed after the answer").not.toBeNull();
  });

  it("closes the crop step and stops the spinner", async () => {
    setAgent("android mobile");
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    choose(fileInputs()[0], png());
    fireEvent.click(screen.getByText("close crop"));
    expect(screen.queryByTestId("crop"), "the crop step did not close").toBeNull();
    expect(camIcon(), "the spinner stayed after closing the crop step").not.toBeNull();
  });

  it.each([
    ["the image-search route's own error", { error: "quota reached" }, "quota reached"],
    ["a general message when the route gives none", {}, "Failed to search with image"],
  ])("shows %s when image search is refused", async (_name, body, shown) => {
    setAgent("android mobile");
    fetchMock.mockResolvedValue({ ok: false, json: async () => body });
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    choose(fileInputs()[0], png());
    await act(async () => fireEvent.click(screen.getByText("save crop")));
    await waitFor(() => expect(showErrorNotification, "the refusal was not shown").toHaveBeenCalledWith(shown));
    expect(LogError, "the refusal was not logged").toHaveBeenCalled();
  });

  it.each([
    ["a thrown string", "boom", "boom"],
    ["an empty throw", "", "failed to search with image"],
  ])("shows %s when image search cannot be reached", async (_name, thrown, shown) => {
    setAgent("android mobile");
    fetchMock.mockRejectedValue(thrown);
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    choose(fileInputs()[0], png());
    await act(async () => fireEvent.click(screen.getByText("save crop")));
    await waitFor(() => expect(showErrorNotification, "the failure was not shown").toHaveBeenCalledWith(shown));
  });
});
