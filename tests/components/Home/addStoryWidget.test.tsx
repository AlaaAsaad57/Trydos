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
vi.mock("components/Home/Stories/CameraStory", () => ({ default: () => null }));
vi.mock("components/global/ParamsUpdater", () => ({ default: () => null }));
vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: ({ onSave, image }: any) => (
    <button data-testid="fake-crop-save" onClick={() => onSave(image)}>
      save
    </button>
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
