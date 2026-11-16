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

// jsdom never loads an <img>, so the real resize would wait for its timeout.
// The resize maths is tested in tests/utils/imageToSearchJpeg.test.ts.
vi.mock("utils/imageToSearchJpeg", () => ({ imageToSearchJpeg: async (f: File) => f }));

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
import { photoFiltersKey } from "components/Home/Search/requestSimilarProducts";

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
    const fromFiles = screen.getByLabelText("Choose File From Device");
    fireEvent.click(fromFiles);
    expect(screen.queryByLabelText("Choose File From Device"), "the menu stayed open after a pick").toBeNull();
    expect(fileInputs().length, "no file picker was opened").toBe(1);
    expect(fileInputs()[0].onblur!(new FocusEvent("blur")), "the picker's blur handler should do nothing").toBeUndefined();
  });

  it("on desktop: the camera option opens the camera, and a shot goes to the crop step", async () => {
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    fireEvent.click(screen.getByLabelText("Take Photo With Camera"));
    fireEvent.click(screen.getByText("close camera"));
    expect(screen.queryByTestId("camera"), "the camera did not close").toBeNull();
    fireEvent.click(camIcon());
    fireEvent.click(screen.getByLabelText("Take Photo With Camera"));
    fireEvent.click(screen.getByText("capture"));
    expect(screen.queryByTestId("camera"), "the camera stayed open after a shot").toBeNull();
    expect(screen.getByTestId("crop").dataset.name, "the shot did not go to the crop step").toBe("shot.png");
  });

  it("closes the menu on a click outside, but not on a click inside", async () => {
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.mouseDown(document.body);
    fireEvent.click(camIcon());
    fireEvent.mouseDown(screen.getByLabelText("Take Photo With Camera"));
    expect(screen.getByLabelText("Take Photo With Camera"), "a click inside closed the menu").toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByLabelText("Take Photo With Camera"), "a click outside did not close the menu").toBeNull();
  });

  it.each([
    ["an iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile"],
    ["an iPad", "Mozilla/5.0 (iPad; CPU OS 17_0)"],
  ])("on %s: opens the file picker straight away", async (_name, ua) => {
    setAgent(ua);
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    expect(screen.queryByLabelText("Take Photo With Camera"), "a phone or tablet got the desktop menu").toBeNull();
    expect(fileInputs().length, "no file picker was opened").toBe(1);
    expect(fileInputs()[0].onblur!(new FocusEvent("blur")), "the picker's blur handler should do nothing").toBeUndefined();
  });

  it("refuses a file that is not a picture and clears the picker", async () => {
    setAgent("android mobile");
    await renderWithProviders(<SearchImage setSearchValue={() => {}} />);
    fireEvent.click(camIcon());
    const target = choose(fileInputs()[0], new File(["x"], "a.pdf", { type: "application/pdf" }));
    expect(window.alert, "a wrong file type was not refused").toHaveBeenCalledWith(
      "Please Select Supported Image Format (Jpeg, Png, Jpg, Webp, Svg, Avif)",
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
    expect(init.credentials, "image search must send the session cookie, or the route refuses it").toBe("same-origin");
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
    ["the image-search route's own error", { error: "quota reached" }, "Quota Reached"],
    ["a general message when the route gives none", {}, "Failed To Search With Image"],
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

  describe("with photo results (search by vector first)", () => {
    const reply = (status: number, body: any) => ({ ok: status < 300, status, json: async () => body });
    const sendPhoto = async (onPhotoResults = vi.fn(), setSearchValue = vi.fn(), filters?: any) => {
      setAgent("android mobile");
      await renderWithProviders(
        <SearchImage setSearchValue={setSearchValue} onPhotoResults={onPhotoResults} filters={filters} />,
      );
      fireEvent.click(camIcon());
      choose(fileInputs()[0], png());
      await act(async () => fireEvent.click(screen.getByText("save crop")));
      return { onPhotoResults, setSearchValue };
    };

    it("sends the photo with the language and country, and hands over the products", async () => {
      const products = [{ product_id: 18, slug: "jacket" }];
      fetchMock.mockResolvedValueOnce(reply(200, { success: true, products }));
      const { onPhotoResults, setSearchValue } = await sendPhoto();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url, "the photo did not go to the vector search route").toBe("/api/image-search/similar");
      // renderWithProviders opens the page at /gb-en.
      expect((init.body as FormData).get("country"), "the country from the route was not sent").toBe("gb");
      expect((init.body as FormData).get("language"), "the language was not sent").toBe("en");
      expect(init.credentials, "the session cookie must go, or the route refuses it").toBe("same-origin");
      await waitFor(() => expect(onPhotoResults, "the products were not handed over").toHaveBeenCalled());
      expect(onPhotoResults.mock.calls[0][0].products, "the wrong products were handed over").toBe(products);
      expect(fetchMock, "the words search ran although products were found").toHaveBeenCalledTimes(1);
      expect(setSearchValue, "the search box was filled although products were found").not.toHaveBeenCalled();
    });

    it("sends the search box filters with the photo, and says which filters the products were found with", async () => {
      fetchMock.mockResolvedValueOnce(reply(200, { success: true, products: [{ product_id: 1 }] }));
      const filters = { brands: ["nike"], categories: [], boutiques: [] };
      const { onPhotoResults } = await sendPhoto(vi.fn(), vi.fn(), filters);
      const sent = (fetchMock.mock.calls[0][1].body as FormData).get("filters");
      expect(JSON.parse(String(sent)), "the filters did not go with the photo").toEqual(filters);
      await waitFor(() => expect(onPhotoResults, "the products were not handed over").toHaveBeenCalled());
      const handed = onPhotoResults.mock.calls[0][0];
      expect(handed.picture, "the sent picture was not handed over for a later filter change").toBe((fetchMock.mock.calls[0][1].body as FormData).get("file"));
      expect(handed.filtersKey, "the filters key does not match the filters sent").toBe(photoFiltersKey(filters));
    });

    it.each([
      ["finds nothing", reply(200, { success: true, products: [] })],
      ["fails on the server", reply(502, { error: "failed to search with image" })],
    ])("falls back to the words search when the vector search %s", async (_name, first) => {
      fetchMock
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "black jacket" }) });
      const { onPhotoResults, setSearchValue } = await sendPhoto();
      await waitFor(() => expect(setSearchValue, "the words search did not fill the search box").toHaveBeenCalledWith("black jacket"));
      expect(fetchMock.mock.calls[1][0], "the fallback went to the wrong route").toBe("/api/image-search");
      expect(onPhotoResults, "photo results were handed over for a failed search").not.toHaveBeenCalled();
    });

    it("falls back to the words search when the vector route cannot be reached", async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError("network"))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ response: "black jacket" }) });
      const { setSearchValue } = await sendPhoto();
      await waitFor(() => expect(setSearchValue, "the words search did not run after a network error").toHaveBeenCalledWith("black jacket"));
    });

    it.each([
      [400, "We could not read this image. Please try another photo."],
      [429, "Too many requests. Please try again in a moment."],
    ])("shows the message and stops on a %s answer", async (status, error) => {
      fetchMock.mockResolvedValueOnce(reply(status, { error }));
      await sendPhoto();
      await waitFor(() => expect(showErrorNotification, `the ${status} message was not shown`).toHaveBeenCalled());
      expect(fetchMock, `the words search ran after a ${status}`).toHaveBeenCalledTimes(1);
      expect(camIcon(), "the spinner stayed after the message").not.toBeNull();
    });
  });

  it.each([
    ["a thrown string", "boom", "Boom"],
    ["an empty throw", "", "Failed To Search With Image"],
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
