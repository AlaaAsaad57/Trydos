import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddStoryWidget from "components/Home/Stories/AddStoryWidget";
import { useAppStore } from "store";

// BUG-1: the upload sheet could hang for ever.
//
// `handleChange` wraps the upload in `await new Promise((resolve, reject) => …)`
// and there were three ways out of that promise that settled it with neither.
// The `await` then never returned, so nothing after it ran — the sheet stayed
// open, the feed was never re-read, and on one path the spinner never stopped.
//
// The three paths:
//
//   1. a video longer than a minute — refused, but the promise was left open
//      **and** `setLoading(false)` was never called;
//   2. the upload refused by a backend — the `.catch` told the shopper and then
//      returned, settling nothing;
//   3. a video the browser never reports as decodable — the poll that waits for
//      `readyState === 4` had no cap at all.
//
// Paths 1 and 3 are driven here, and both are user-visible: the sheet stops
// responding. Path 3 needs no fake at all — jsdom genuinely never decodes a
// video. Path 2 is fixed in the same edit but not claimed as proved; see the
// note at the end of this file for why.

const upload = vi.fn();
// What the crop stand-in hands back on save; null means "the picture as given".
const cropOverride = vi.hoisted(() => ({ file: null as File | null }));
const fetchStoriesForUser = vi.fn(async (..._args: any[]) => ({
  data: [],
  next_page_url: undefined,
}));
const showErrorNotification = vi.fn();
const showSuccessNotification = vi.fn();

vi.mock("services/story", () => ({
  default: {
    upload: (...args: any[]) => upload(...args),
  },
}));

vi.mock("serverRequests", () => ({
  fetchStoriesForUser: (...args: any[]) => fetchStoriesForUser(...args),
}));

vi.mock("store/notifications/reducer", () => ({
  showErrorNotification: (...args: any[]) => showErrorNotification(...args),
  showSuccessNotification: (...args: any[]) => showSuccessNotification(...args),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "sy-en" }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/sy-en",
}));

// The camera and the crop editor are separate screens with their own hardware
// and canvas work. Neither is on the path under test.
// Later cases drive the camera's three callbacks through these buttons.
vi.mock("components/Home/Stories/CameraStory", () => ({
  default: ({ send, HandleUploadedVideo, close }: any) => (
    <div data-testid="fake-camera">
      <button onClick={() => send("data:image/png;base64,iVBORw0KGgo=")}>camera photo</button>
      <button onClick={() => HandleUploadedVideo(new File(["v"], "rec.webm", { type: "video/webm" }))}>camera video</button>
      <button onClick={close}>camera close</button>
    </div>
  ),
}));
vi.mock("components/global/ParamsUpdater", () => ({ default: () => null }));
vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: ({ onSave, onClose, image }: any) => (
    <>
      <button data-testid="fake-crop-save" onClick={() => onSave(cropOverride.file ?? image)}>
        save
      </button>
      <button data-testid="fake-crop-close" onClick={onClose}>
        close
      </button>
    </>
  ),
}));

/** A file the browser will never manage to decode — which is every video, in
 *  jsdom. That is the point: it is path 3 exactly as a shopper would hit it. */
const videoFile = () =>
  new File(["not really a video"], "clip.mp4", { type: "video/mp4" });

const imageFile = () =>
  new File(["not really a picture"], "shot.png", { type: "image/png" });

/** Choose a file through the hidden input the sheet drives. */
const chooseFile = async (file: File) => {
  const input = document.querySelector<HTMLInputElement>("#stories-input-holder");
  expect(input, "the sheet rendered without its file input").not.toBeNull();

  await act(async () => {
    fireEvent.change(input!, { target: { files: [file] } });
  });
};

// Queried by attribute: this project marks its hooks `data-pw`, and the React
// testing library looks for `data-testid`.
const shareButton = () =>
  document.querySelector<HTMLButtonElement>('[data-pw="share-story-button"]');

const openSheet = () => {
  useAppStore.setState({
    addStoryEnable: true,
    userProfile: { phone: "999000000001", is_allowed_to_upload_story: 1 },
    userStories: { id: 41 },
  } as any);
};

describe("BUG-1 — the upload sheet always stops, whatever the upload does", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    openSheet();
  });

  it("stops waiting for a video the browser never decodes", async () => {
    // No backend refuses anything here. The file simply never becomes
    // decodable, which is what the poll inside the sheet waits for.
    render(<AddStoryWidget />);

    await chooseFile(videoFile());
    await waitFor(() =>
      expect(
        shareButton(),
        "the sheet never offered Share after a video was chosen, so this case never reached the upload",
      ).not.toBeNull(),
    );

    await act(async () => {
      fireEvent.click(shareButton()!);
    });

    // Long enough that any honest cap has passed. Before the fix the sheet waits
    // here for ever: the poll has no ceiling, so nothing ever settles.
    await act(async () => {
      await vi.waitFor(
        () =>
          expect(
            showErrorNotification,
            "the sheet is still waiting for a video the browser will never decode. Nothing settles the upload promise, so the shopper is left on a spinner with no way out but reloading the page",
          ).toHaveBeenCalled(),
        { timeout: 12_000, interval: 100 },
      );
    });

    expect(
      upload,
      "the sheet sent a file to the media server that it had never managed to decode",
    ).not.toHaveBeenCalled();
  }, 20_000);

  it("stops when the video is longer than the minute it allows", async () => {
    // jsdom decodes nothing, so the element that reports a duration is stood in
    // for here. That is the one capability being faked; everything after it —
    // the poll, the refusal, and whether the sheet ever recovers — is the real
    // component.
    render(<AddStoryWidget />);

    await chooseFile(videoFile());
    await waitFor(() =>
      expect(
        shareButton(),
        "the sheet never offered Share after a video was chosen",
      ).not.toBeNull(),
    );

    // Installed only now, so React's own rendering above used the real one.
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: any, ...rest: any[]) => {
      if (tag !== "video") return realCreate(tag, ...rest);
      return { readyState: 4, duration: 90, src: "" } as any;
    });

    await act(async () => {
      fireEvent.click(shareButton()!);
    });

    // The sheet must come back to life. Before the fix this branch showed the
    // message and then returned without settling the upload promise **and**
    // without clearing `loading`, so the control stayed disabled for ever and
    // the only way on was to reload the page.
    await waitFor(
      () =>
        expect(
          shareButton()?.disabled,
          "the sheet refused a video over a minute long and then stayed stuck: the Share control is still disabled, so the shopper cannot choose another file or try again without reloading the page",
        ).toBe(false),
      { timeout: 10_000 },
    );

    expect(
      showErrorNotification,
      "the video was refused for being too long and the shopper was told nothing",
    ).toHaveBeenCalled();

    expect(
      upload,
      "a video longer than the allowed minute was sent to the media server anyway",
    ).not.toHaveBeenCalled();
  }, 20_000);

  // **No case for a refused upload.** The sheet's `.catch` already tells the
  // shopper and already clears the spinner, so a refusal looks the same before
  // and after this fix — what it leaves behind is a promise that never settles,
  // which nothing on screen can see. It is fixed in the same edit for
  // correctness, and deliberately not claimed as proved here: a test that
  // passes either way covers nothing.
});

// ---------------------------------------------------------------------------
// The rest of the sheet: choosing, previewing, the link, the camera and each
// upload outcome. Same stand-ins as above; `upload` is the stories media
// upload and `fetchStoriesForUser` re-reads the stories bar afterwards.
// ---------------------------------------------------------------------------

/** Choose a picture, save it from the crop step, and wait for the preview. */
const pickImage = async (file: File = imageFile()) => {
  await chooseFile(file);
  fireEvent.click(screen.getByTestId("fake-crop-save"));
  await waitFor(() => expect(shareButton(), "the saved picture was not previewed").not.toBeNull());
};

/** The browser "decodes" the video, with the given length in seconds. */
const decodableVideo = (duration: number) => {
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: any, ...rest: any[]) => {
    if (tag !== "video") return realCreate(tag, ...rest);
    return { readyState: 4, duration, src: "" } as any;
  });
};

const linkInput = () => document.querySelector<HTMLInputElement>('[data-pw="link-story-input"]')!;

describe("AddStoryWidget — choosing, previewing and uploading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();
    cropOverride.file = null;
    openSheet();
    fetchStoriesForUser.mockResolvedValue({ data: [{ id: 1 }], next_page_url: undefined });
  });

  it("draws nothing while the sheet is closed", () => {
    useAppStore.setState({ addStoryEnable: false } as any);
    const { container } = render(<AddStoryWidget />);
    expect(container.innerHTML, "a closed sheet drew something").toBe("");
  });

  it("uploads a cropped picture with its link, refreshes the bar and closes", async () => {
    upload.mockImplementation(async (_f: any, onProgress: any) => {
      onProgress(30);
      return {};
    });
    render(<AddStoryWidget />);
    await pickImage();
    fireEvent.change(linkInput(), { target: { value: "shop.example.com" } });
    fireEvent.blur(linkInput());
    await act(async () => {
      fireEvent.click(shareButton()!);
    });
    await waitFor(() =>
      expect(showSuccessNotification, "the shopper was not told the story was uploaded").toHaveBeenCalledWith("Story Uploaded"),
    );
    expect(upload.mock.calls[0][2], "a picture was uploaded as a video").toBe(0);
    expect(upload.mock.calls[0][4], "the link was not sent with https:// in front").toBe("https://shop.example.com");
    expect((useAppStore.getState() as any).storiesData, "the stories bar was not refreshed").toEqual([{ id: 1 }]);
    expect((useAppStore.getState() as any).addStoryEnable, "the sheet did not close after the upload").toBeFalsy();
  });

  it("keeps the sheet open and tells the shopper when the stories media upload refuses a picture", async () => {
    upload.mockRejectedValue(new Error("media down"));
    render(<AddStoryWidget />);
    await pickImage();
    await act(async () => {
      fireEvent.click(shareButton()!);
    });
    await waitFor(() =>
      expect(showErrorNotification, "a refused picture upload was not reported").toHaveBeenCalledWith("Upload Failed Try Again"),
    );
    expect(fetchStoriesForUser, "the bar was re-read after a refused upload").not.toHaveBeenCalled();
    await waitFor(() => expect(shareButton()?.disabled, "the sheet stayed disabled after a refusal").toBe(false));
  });

  it("reports an error when re-reading the stories bar fails after an upload", async () => {
    upload.mockResolvedValue({});
    fetchStoriesForUser.mockRejectedValue(new Error("stories down"));
    render(<AddStoryWidget />);
    await pickImage();
    await act(async () => {
      fireEvent.click(shareButton()!);
    });
    await waitFor(() =>
      expect(showErrorNotification, "a failed bar refresh was not reported").toHaveBeenCalledWith("Error Uploading Story"),
    );
  });

  it("refuses a cropped picture over 10 MB", async () => {
    cropOverride.file = new File([new Uint8Array(11 * 1024 * 1024)], "big.png", { type: "image/png" });
    render(<AddStoryWidget />);
    await pickImage();
    await act(async () => {
      fireEvent.click(shareButton()!);
    });
    expect(showErrorNotification, "a picture over 10 MB was not refused").toHaveBeenCalledWith("File size should not exceed 10 MB");
    expect(upload, "a picture over 10 MB was uploaded").not.toHaveBeenCalled();
  });

  it("uploads nothing for a cropped file that is neither picture nor video", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    cropOverride.file = new File(["t"], "notes.txt", { type: "text/plain" });
    render(<AddStoryWidget />);
    await pickImage();
    await act(async () => {
      fireEvent.click(shareButton()!);
    });
    act(() => vi.advanceTimersByTime(6000));
    expect(upload, "a text file was uploaded as a story").not.toHaveBeenCalled();
    expect((useAppStore.getState() as any).storiesRefreshing, "the refreshing flag was left on").toBe(false);
  });

  it("uploads a short video, refreshes the bar and closes", async () => {
    upload.mockImplementation(async (_f: any, onProgress: any, _t: any, onDone: any) => {
      onProgress(50);
      onDone();
      return {};
    });
    render(<AddStoryWidget />);
    await chooseFile(videoFile());
    await waitFor(() => expect(shareButton(), "the video was not previewed").not.toBeNull());
    expect(document.querySelector("video"), "the video preview is missing").not.toBeNull();
    decodableVideo(10);
    await act(async () => {
      fireEvent.click(shareButton()!);
    });
    await waitFor(
      () => expect(showSuccessNotification, "the video upload was not confirmed").toHaveBeenCalledWith("Story Uploaded"),
      { timeout: 5000 },
    );
    expect(upload.mock.calls[0][2], "a video was uploaded as a picture").toBe(1);
  });

  it("tells the shopper when the stories media upload refuses a video", async () => {
    upload.mockRejectedValue(new Error("media down"));
    render(<AddStoryWidget />);
    await chooseFile(videoFile());
    await waitFor(() => expect(shareButton(), "the video was not previewed").not.toBeNull());
    decodableVideo(10);
    await act(async () => {
      fireEvent.click(shareButton()!);
    });
    await waitFor(
      () => expect(showErrorNotification, "a refused video upload was not reported").toHaveBeenCalledWith("Upload Failed Try Again"),
      { timeout: 5000 },
    );
    expect(fetchStoriesForUser, "the bar was re-read after a refused video").not.toHaveBeenCalled();
  });

  it("refuses an SVG, a file over 10 MB and a file that is not media, and ignores an empty pick", async () => {
    render(<AddStoryWidget />);
    await chooseFile(new File(["<svg/>"], "a.svg", { type: "image/svg+xml" }));
    expect(showErrorNotification, "an SVG was not refused").toHaveBeenCalledWith("SVG Images Not Allowed");
    await chooseFile(new File([new Uint8Array(11 * 1024 * 1024)], "big.mp4", { type: "video/mp4" }));
    expect(showErrorNotification, "a file over 10 MB was not refused").toHaveBeenCalledWith("File size should not exceed 10 MB");
    await chooseFile(new File(["x"], "a.pdf", { type: "application/pdf" }));
    const input = document.querySelector<HTMLInputElement>("#stories-input-holder")!;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    expect(screen.getByText("No media selected"), "a refused or empty pick produced a preview").toBeInTheDocument();
  });

  it("clears the preview, and the crop step can be closed", async () => {
    render(<AddStoryWidget />);
    await pickImage();
    expect(screen.getByAltText("Preview"), "the picture preview is missing").toBeInTheDocument();
    fireEvent.click(screen.getByAltText("Preview").parentElement!.querySelector("button")!);
    expect(screen.getByText("No media selected"), "clearing did not remove the preview").toBeInTheDocument();
    await chooseFile(imageFile());
    fireEvent.click(screen.getByTestId("fake-crop-close"));
    expect(screen.queryByTestId("fake-crop-save"), "the crop step did not close").toBeNull();
  });

  it("checks the link as it is typed and blocks Share on a bad one", async () => {
    render(<AddStoryWidget />);
    await pickImage();
    fireEvent.change(linkInput(), { target: { value: "localhost" } });
    expect(
      screen.getByText("Please enter a valid URL (e.g., example.com or www.example.com)"),
      "a link with no dot was accepted",
    ).toBeInTheDocument();
    expect(shareButton()!.disabled, "Share stayed on with a bad link").toBe(true);
    fireEvent.change(linkInput(), { target: { value: "https://a b.com" } });
    expect(shareButton()!.disabled, "Share stayed on with a link that is not a URL").toBe(true);
    fireEvent.change(linkInput(), { target: { value: "" } });
    expect(shareButton()!.disabled, "Share stayed off after the link was cleared").toBe(false);
    fireEvent.change(linkInput(), { target: { value: "http://ok.example.com" } });
    expect(shareButton()!.disabled, "a full http link was refused").toBe(false);
  });

  it("opens the gallery picker from its option", async () => {
    render(<AddStoryWidget />);
    const input = document.querySelector<HTMLInputElement>("#stories-input-holder")!;
    const click = vi.spyOn(input, "click");
    fireEvent.click(document.querySelector('[data-pw="Gallery-Photo-Option"]')!);
    expect(click, "the gallery option did not open the file picker").toHaveBeenCalled();
  });

  it("asks for camera permission when it is revoked, instead of opening the camera", async () => {
    const checkCameraPermissions = vi.fn();
    useAppStore.setState({ cameraPermissions: "revoked", checkCameraPermissions } as any);
    render(<AddStoryWidget />);
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(checkCameraPermissions, "a revoked permission was not asked again").toHaveBeenCalled();
    expect(showErrorNotification, "the shopper was not told to enable the camera").toHaveBeenCalledWith(
      "Please enable camera permissions to use camera features",
    );
    expect(screen.queryByTestId("fake-camera"), "the camera opened without permission").toBeNull();
  });

  it("asks once when permission was never given, then opens the camera, whose photo goes to the crop step", async () => {
    const checkCameraPermissions = vi.fn(async () => {});
    useAppStore.setState({ cameraPermissions: "asked", checkCameraPermissions } as any);
    render(<AddStoryWidget />);
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    expect(checkCameraPermissions, "the permission was not asked").toHaveBeenCalled();
    fireEvent.click(screen.getByText("camera photo"));
    expect(screen.getByTestId("fake-crop-save"), "the camera photo did not reach the crop step").toBeInTheDocument();
  });

  it("previews a camera video, and closing the camera gives back page scrolling", async () => {
    useAppStore.setState({ cameraPermissions: "granted" } as any);
    render(<AddStoryWidget />);
    await act(async () => {
      fireEvent.click(screen.getByText("Take Photo"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("camera video"));
    });
    await waitFor(() => expect(shareButton(), "the camera video was not previewed").not.toBeNull());
    fireEvent.click(screen.getByText("camera close"));
    expect(screen.queryByTestId("fake-camera"), "the camera did not close").toBeNull();
    expect(document.body.style.overflow, "page scrolling was not given back").toBe("scroll");
  });

  it("closes the whole sheet from its X", async () => {
    render(<AddStoryWidget />);
    fireEvent.click(screen.getByText("Add Story").parentElement!.querySelector("button")!);
    expect((useAppStore.getState() as any).addStoryEnable, "the X did not close the sheet").toBeFalsy();
  });
});
