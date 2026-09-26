// The profile picture screen: choosing one, removing one, and what happens when
// the upload is refused.
//
// ---------------------------------------------------------------------------
// The refused case is the reason this file is careful
//
// Two review rounds found the same trap one layer apart, and both would have
// produced a check that reported "pass" for a case it never ran:
//
//   1. The upload handler reads `getImage()` and `getImageScaledToCanvas()` off
//      the editor. A stub without them returns `undefined`.
//   2. The value that comes back is fed to `dataURLtoFile`, which runs `atob()`
//      on its tail and regex-matches the mime off its head. A placeholder string
//      throws there.
//
// Either way the throw lands in the component's own `catch`, which only logs —
// so the upload is never attempted, nothing changes on screen, and every
// "nothing happened" assertion passes for the wrong reason.
//
// So the editor stub returns a **real** base64 data URL, and the refused case
// asserts the upload was **actually attempted** before it asserts anything about
// the outcome. That last assertion is what makes the stub's own correctness
// self-checking: break the stub and this file goes red instead of green.
//
// ---------------------------------------------------------------------------
// What the screen does NOT do when an upload is refused
//
// It says nothing. The reply is read, that throws, the handler logs it, and the
// navigation never happens — the shopper is left looking at the screen with no
// message and no idea it failed. AC-12 was rewritten to record exactly that,
// because the criterion it replaced ("what it says") described behaviour this
// screen does not have. The silence is a real defect and is raised as its own
// finding; this file pins the behaviour, it does not fix it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** A real one-pixel JPEG. It has to survive `atob()` — see the note above. */
const REAL_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

vi.mock("react-avatar-editor", () => ({
  default: (props: Record<string, unknown>) => {
    const ref = props.ref as { current: unknown } | undefined;
    if (ref) {
      ref.current = {
        getImage: () => ({}),
        getImageScaledToCanvas: () => ({ toDataURL: () => REAL_DATA_URL }),
      };
    }
    return (
      <div data-testid="avatar-editor">
        <button
          onClick={() => (props.onPositionChange as (p: unknown) => void)({ x: 0.4, y: 0.5 })}
        >
          drag picture
        </button>
      </div>
    );
  },
}));

const updateProfileImage = vi.fn();
// Typed with its arguments: these cases read the payload back off the call, so a
// no-argument signature would make that a type error rather than a check.
const updateProfile = vi.fn(
  async (_payload?: Record<string, unknown>, _user?: unknown) => ({
    success: true,
  }),
);
vi.mock("services/auth", () => ({
  default: {
    UpdateProfileImage: (...a: unknown[]) => updateProfileImage(...(a as [])),
    UpdateProfile: (...a: unknown[]) => updateProfile(...(a as [])),
  },
}));

// `LogError` is the only seam the refused case has for "the failure was logged".
const showErrorNotification = vi.fn();
vi.mock("store/notifications/reducer", () => ({
  showErrorNotification: (...a: unknown[]) => showErrorNotification(...(a as [])),
}));
vi.mock("@/store/notifications/reducer", () => ({
  showErrorNotification: (...a: unknown[]) => showErrorNotification(...(a as [])),
}));

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  LogError: (...a: unknown[]) => logError(...(a as [])),
}));

import UploadProfilePhoto from "components/settings/UploadProfilePhoto";
import { buildUser } from "../../fixtures/user";
import {
  restoreLocation,
  stubLocation,
  type LocationStub,
} from "../../mocks/location";
import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const ACCOUNT = buildUser({ image: "/user/test-user.png" });

let location: LocationStub;

const show = (overrides: Record<string, unknown> = {}) =>
  renderWithProviders(
    <UploadProfilePhoto
      local="gb-en"
      isRtl={false}
      userProfile={{ ...ACCOUNT, ...overrides }}
    />,
    { store: { userProfile: { ...ACCOUNT, ...overrides } } },
  );

/** Pick a picture, the way a shopper does — through the hidden file input.
 *
 *  jsdom implements neither `createObjectURL` nor `revokeObjectURL`, and this is
 *  the only way to put the screen into a state where Save appears at all. */
const choosePicture = async (user: ReturnType<typeof userEvent.setup>) => {
  const input = document.querySelector<HTMLInputElement>(
    "#profile-file-picker",
  );
  expect(
    input,
    "the picture screen has no file input, so a shopper has no way to choose a picture",
  ).not.toBeNull();
  await user.upload(
    input as HTMLInputElement,
    new File(["x"], "photo.jpg", { type: "image/jpeg" }),
  );
};

beforeEach(() => {
  location = stubLocation();
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:chosen-picture"),
    revokeObjectURL: vi.fn(),
  });
  updateProfileImage.mockReset();
  updateProfile.mockClear();
  logError.mockClear();
  showErrorNotification.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  restoreLocation();
  vi.clearAllMocks();
});

describe("choosing a picture", () => {
  it("puts the screen into a state where the shopper can save it", async () => {
    const user = userEvent.setup();
    await show();

    expect(
      screen.queryByText("Save"),
      "the screen offered Save before the shopper had chosen anything, so it would upload the picture already on the account",
    ).not.toBeInTheDocument();

    await choosePicture(user);

    expect(
      screen.getByText("Save"),
      "the shopper chose a picture and the screen never offered to save it",
    ).toBeInTheDocument();
  });

  it("uploads it and sends the stored path on to the profile", async () => {
    const user = userEvent.setup();
    updateProfileImage.mockResolvedValue({ sub_path: "/user/new-picture.png" });
    await show();

    await choosePicture(user);
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(
        updateProfileImage,
        "the shopper saved a chosen picture and the MEDIA backend was never asked to store it",
      ).toHaveBeenCalled();
    });

    // The value, not merely that something was sent: a picture uploaded but not
    // attached to the profile is a picture the shopper never gets back.
    await waitFor(() => {
      expect(
        updateProfile.mock.calls.at(-1)?.[0],
        "the picture was stored but its path was never attached to the shopper's profile",
      ).toMatchObject({ image: "/user/new-picture.png" });
    });
  });
});

describe("removing a picture", () => {
  it("clears it and saves the profile with no picture", async () => {
    const user = userEvent.setup();
    await show();

    // By its visible words. The control carries a `data-pw` marker for the
    // browser suite, which is not the attribute Testing Library queries.
    await user.click(screen.getByText("Remove Photo"));
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(
        updateProfile.mock.calls.at(-1)?.[0],
        "the shopper removed their picture and the profile was not told to clear it",
      ).toMatchObject({ image: null });
    });

    expect(
      updateProfileImage,
      "removing a picture uploaded something to the MEDIA backend, when there is nothing to upload",
    ).not.toHaveBeenCalled();
  });
});

describe("an upload the media backend refuses", () => {
  it("attempts the upload, then saves nothing and leaves the shopper where they were", async () => {
    const user = userEvent.setup();
    // What the service really does on a refusal: it swallows the failure and
    // answers `null`. A rejecting stub would exercise a path the app never takes.
    updateProfileImage.mockResolvedValue(null);
    await show();

    await choosePicture(user);
    await user.click(screen.getByText("Save"));

    // FIRST, and this assertion is the point: prove the upload was really
    // attempted. Everything below is "nothing happened", and "nothing happened"
    // is also what a broken stub produces.
    await waitFor(() => {
      expect(
        updateProfileImage,
        "the upload was never attempted, so the assertions below would pass without testing the refusal at all — check the editor stub returns a real data URL",
      ).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        logError,
        "the MEDIA backend refused the upload and nothing recorded it",
      ).toHaveBeenCalled();
    });

    expect(
      updateProfile,
      "the picture was refused but the profile was updated anyway, so the shopper's profile now points at a picture that was never stored",
    ).not.toHaveBeenCalled();

    expect(
      location.href,
      "the shopper was navigated away as though the upload had worked",
    ).toBeNull();
  });

  it("tells the shopper the upload failed", async () => {
    const user = userEvent.setup();
    updateProfileImage.mockResolvedValue(null);
    await show();

    await choosePicture(user);
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(
        updateProfileImage,
        "the upload was never attempted, so this case proves nothing about the refusal",
      ).toHaveBeenCalled();
    });

    // A refusal the shopper is not told about is indistinguishable from a save
    // that worked: the screen stops its spinner and stays put either way.
    await waitFor(() => {
      expect(
        showErrorNotification,
        "the MEDIA backend refused the picture and the shopper was told nothing — the screen just stops, so they cannot tell it from success",
      ).toHaveBeenCalled();
    });
    expect(
      showErrorNotification.mock.calls[0]?.[0],
      "the shopper was shown an empty message instead of one saying the upload failed",
    ).toBeTruthy();
  });
});

describe("the saved picture", () => {
  it("sends the shopper back to the profile after a successful save", async () => {
    const user = userEvent.setup();
    updateProfileImage.mockResolvedValue({ sub_path: "/user/new-picture.png" });
    await show();
    await choosePicture(user);
    await user.click(screen.getByText("Save"));
    await waitFor(() =>
      expect(location.href, "a saved picture did not return the shopper to the profile").toBe(
        "/gb-en/settings/profile",
      ),
    );
  });

  it("dragging the current picture offers Save", async () => {
    const user = userEvent.setup();
    await show();
    expect(screen.queryByText("Save"), "Save was offered before anything changed").not.toBeInTheDocument();
    await user.click(screen.getByText("drag picture"));
    expect(screen.getByText("Save"), "moving the picture did not offer Save").toBeInTheDocument();
  });

  it("logs a profile update that throws and stays on the screen", async () => {
    const user = userEvent.setup();
    updateProfile.mockRejectedValueOnce(new Error("profile down"));
    await show();
    await user.click(screen.getByText("Remove Photo"));
    await user.click(screen.getByText("Save"));
    await waitFor(() =>
      expect(logError, "a failed profile update was not logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In UploadFile in UploadProfilePhoto" }),
      ),
    );
    expect(location.href, "a failed save still navigated").toBeNull();
  });
});

describe("a guest on the picture screen", () => {
  it.each(["0", 0, null, "", "12"])("any tap with phone %j opens sign-in instead", async (phone) => {
    const setLoginOpen = vi.fn();
    const guest = { ...ACCOUNT, phone };
    await renderWithProviders(
      <UploadProfilePhoto local="gb-en" isRtl={false} userProfile={guest} />,
      { store: { userProfile: null, setLoginOpen } },
    );
    await userEvent.setup().click(screen.getByText("Remove Photo"));
    expect(setLoginOpen, "a guest tap did not open sign-in").toHaveBeenCalledWith(true);
    expect(screen.getByText("Remove Photo"), "a guest tap still removed the picture").toBeInTheDocument();
  });

  it("with no profile at all, the screen is faded and taps open sign-in", async () => {
    const setLoginOpen = vi.fn();
    const { container } = await renderWithProviders(
      <UploadProfilePhoto local="gb-en" isRtl={false} userProfile={null} />,
      { store: { userProfile: null, setLoginOpen } },
    );
    expect((container.firstChild as HTMLElement).className, "a guest screen is not faded").toContain("opacity-65");
    await userEvent.setup().click(document.querySelector('[data-pw="change-photo-menu"]')!);
    expect(setLoginOpen, "a guest tap on the picture did not open sign-in").toHaveBeenCalledWith(true);
  });
});

describe("the add-picture menu", () => {
  const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByText("Remove Photo"));
    await user.click(document.querySelector('[data-pw="change-photo-menu"]')!);
  };

  it("opens when there is no picture, and the backdrop closes it", async () => {
    const user = userEvent.setup();
    await show();
    await openMenu(user);
    const backdrop = document.querySelector(".fixed.z-40") as HTMLElement;
    expect(backdrop, "tapping the empty picture did not open the menu").not.toBeNull();
    await user.click(backdrop);
    expect(document.querySelector(".fixed.z-40"), "the backdrop did not close the menu").toBeNull();
  });

  it("Choose From Library opens the file picker", async () => {
    const user = userEvent.setup();
    await show();
    await openMenu(user);
    const click = vi.spyOn(
      document.querySelector<HTMLInputElement>("#profile-file-picker")!,
      "click",
    );
    await user.click(screen.getByText("Choose From Library"));
    expect(click, "Choose From Library did not open the file picker").toHaveBeenCalled();
  });

  describe("Take Photo", () => {
    const track = { stop: vi.fn() };
    const stream = { getTracks: () => [track] };

    beforeEach(() => {
      track.stop.mockClear();
      vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(async () => {});
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as any);
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (cb: BlobCallback) {
        cb(new Blob(["x"], { type: "image/jpeg" }));
      });
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const cameraButtons = () =>
      document.querySelectorAll<HTMLButtonElement>("#camera-photo-holder > div > button");

    it("opens the camera, and the capture button puts the photo on screen", async () => {
      vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getUserMedia: vi.fn(async () => stream) } });
      const user = userEvent.setup();
      await show();
      await openMenu(user);
      await user.click(screen.getByText("Take Photo"));

      await waitFor(() =>
        expect(cameraButtons()[1]?.onclick, "the camera capture button was never armed").toBeTruthy(),
      );
      cameraButtons()[1].click();
      expect(track.stop, "the camera was not switched off after the capture").toHaveBeenCalled();
      await waitFor(() =>
        expect(screen.getByText("Save"), "the captured photo did not become the new picture").toBeInTheDocument(),
      );
      expect(document.querySelector("#camera-photo-holder video"), "the camera overlay was not removed after the capture").toBeNull();
    });

    it("the cancel button switches the camera off and closes it", async () => {
      vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getUserMedia: vi.fn(async () => stream) } });
      const user = userEvent.setup();
      await show();
      await openMenu(user);
      await user.click(screen.getByText("Take Photo"));
      await waitFor(() => expect(cameraButtons()[1]?.onclick).toBeTruthy());
      cameraButtons()[0].click();
      expect(track.stop, "cancel did not switch the camera off").toHaveBeenCalled();
      expect(document.querySelector("#camera-photo-holder video"), "cancel did not close the camera").toBeNull();
    });

    it("logs a camera that cannot be opened and closes the overlay", async () => {
      vi.stubGlobal("navigator", {
        ...navigator,
        mediaDevices: { getUserMedia: vi.fn(async () => { throw new Error("denied"); }) },
      });
      const user = userEvent.setup();
      await show();
      await openMenu(user);
      await user.click(screen.getByText("Take Photo"));
      await waitFor(() =>
        expect(logError, "a camera that could not open was not logged").toHaveBeenCalledWith(
          expect.objectContaining({ scenario: "UploadProfilePhoto: the camera could not be opened" }),
        ),
      );
      expect(document.querySelector("#camera-photo-holder video"), "the failed camera overlay was left on screen").toBeNull();
    });
  });
});
