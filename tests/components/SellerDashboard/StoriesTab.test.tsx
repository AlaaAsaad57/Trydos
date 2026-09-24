// The Stories section of the seller dashboard.
//
// The stories server answers in more than one shape, which is the source of
// most of the care here:
//   - the rows can sit under `data.data` or under `data.stories`
//   - they can come back flat, or grouped with a nested `stories` array
//   - `is_video` is not always sent, so a video is inferred from its path
//   - pages are told either by `meta` or by a bare `next_page_url`
//
// Two permissions gate it: create (Add Story) and delete (the bin on a card
// and the confirm panel behind it).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSellerStories = vi.fn();
const deleteSellerStory = vi.fn();
const getSellerProducts = vi.fn();
const uploadStoryToMediaServer = vi.fn();
const saveSellerStory = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerStories: (...a: unknown[]) => getSellerStories(...a),
    deleteSellerStory: (...a: unknown[]) => deleteSellerStory(...a),
    getSellerProducts: (...a: unknown[]) => getSellerProducts(...a),
    uploadStoryToMediaServer: (...a: unknown[]) => uploadStoryToMediaServer(...a),
    saveSellerStory: (...a: unknown[]) => saveSellerStory(...a),
  },
}));

// The crop widget is only reached after a picture is chosen, and it pulls in
// canvas work jsdom cannot do. The stand-in offers the two ways out the real
// one has: save the (unchanged) picture, or close without saving.
vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: ({
    image,
    onSave,
    onClose,
  }: {
    image: File;
    onSave: (f: File) => void;
    onClose: () => void;
  }) => (
    <div data-testid="crop">
      <button type="button" onClick={() => onSave(image)}>
        crop-save
      </button>
      <button type="button" onClick={onClose}>
        crop-close
      </button>
    </div>
  ),
}));

import StoriesTab from "components/SellerDashboard/StoriesTab";
import { useNotificationStore } from "store/notifications/reducer";

import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../render";

const SELLER_ID = "77";
const USER_ID = 5;

const story = (over: Record<string, unknown> = {}) => ({
  id: 1,
  photo_path: "https://example.com/stories/one.webp",
  full_video_path: null,
  link: null,
  created_at: "2026-01-05T10:00:00Z",
  viewers_count: 12,
  product_slug: null,
  ...over,
});

/** The flat shape: rows under data.data, pages told by meta. */
const listAnswer = (
  stories: unknown[],
  meta: Record<string, unknown> | null = {
    current_page: 1,
    last_page: 1,
    total: 1,
  },
) => ({ success: true, data: { data: stories, meta } });

async function mount(
  props: { canCreate?: boolean; canDelete?: boolean } = {},
) {
  return renderWithProviders(
    <StoriesTab
      sellerId={SELLER_ID}
      userId={USER_ID}
      canCreate={true}
      canDelete={true}
      {...props}
    />,
    { path: `/sellerProfile/sellerDashboard/${SELLER_ID}` },
  );
}

beforeEach(() => {
  getSellerStories.mockReset();
  deleteSellerStory.mockReset();
  getSellerProducts.mockReset();
  uploadStoryToMediaServer.mockReset();
  saveSellerStory.mockReset();
  getSellerProducts.mockResolvedValue({ success: true, data: { products: [] } });
  // The toast list is its own store, and it is what a refusal is reported on.
  useNotificationStore.getState().clearNotifications();
  getSellerStories.mockResolvedValue(listAnswer([story()]));
});

describe("Stories section — loading the list", () => {
  it("asks the stories server for this shop's first page", async () => {
    await mount();
    await waitFor(() => expect(getSellerStories).toHaveBeenCalled());
    expect(
      getSellerStories,
      "the stories request should name the shop, the user and the page",
    ).toHaveBeenCalledWith(SELLER_ID, USER_ID, 1);
  });

  it("shows a photo story with its view count", async () => {
    await mount();
    expect(
      await screen.findByAltText("Story thumbnail"),
      "a photo story should be drawn as a picture",
    ).toBeInTheDocument();
    expect(
      screen.getByText("12"),
      "the seller should see how many people watched the story",
    ).toBeInTheDocument();
  });

  it("treats a story with a video path as a video, with no is_video flag", async () => {
    getSellerStories.mockResolvedValue(
      listAnswer([
        story({
          photo_path: null,
          full_video_path: "https://example.com/stories/one.mp4",
        }),
      ]),
    );
    await mount();
    expect(
      await screen.findByText("Video"),
      "the stories server does not always send is_video, so a video path must be enough",
    ).toBeInTheDocument();
  });

  it("reads rows that came back under data.stories", async () => {
    getSellerStories.mockResolvedValue({
      success: true,
      data: { stories: [story()], meta: null },
    });
    await mount();
    expect(
      await screen.findByAltText("Story thumbnail"),
      "rows under data.stories should be read the same as rows under data.data",
    ).toBeInTheDocument();
  });

  it("flattens rows that came back grouped", async () => {
    getSellerStories.mockResolvedValue({
      success: true,
      data: {
        data: [
          { stories: [story({ id: 1, link: "https://a.example" })] },
          { stories: [story({ id: 2, link: "https://b.example" })] },
        ],
        meta: null,
      },
    });
    await mount();
    expect(
      await screen.findByText("https://a.example"),
      "the first group's story should be shown",
    ).toBeInTheDocument();
    expect(
      screen.getByText("https://b.example"),
      "a grouped answer must not hide every group after the first",
    ).toBeInTheDocument();
  });

  it("shows the story's link and linked product on the card", async () => {
    getSellerStories.mockResolvedValue(
      listAnswer([
        story({ link: "https://shop.example/sale", product_slug: "blue-shoe" }),
      ]),
    );
    await mount();
    expect(
      await screen.findByText("https://shop.example/sale"),
      "a story with a link should show where it points",
    ).toBeInTheDocument();
    expect(
      screen.getByText("blue-shoe"),
      "a story attached to a product should name that product",
    ).toBeInTheDocument();
  });

  it("says when the shop has no stories", async () => {
    getSellerStories.mockResolvedValue(listAnswer([]));
    await mount();
    expect(
      await screen.findByText("No stories yet"),
      "an empty section should say so rather than show an empty grid",
    ).toBeInTheDocument();
  });

  it("shows the stories server's own reason for refusing", async () => {
    getSellerStories.mockResolvedValue({
      success: false,
      message: "The stories server is unavailable.",
    });
    await mount();
    expect(
      await screen.findByText("The stories server is unavailable."),
      "the seller should read what the stories server said, not a generic error",
    ).toBeInTheDocument();
  });

  it("loads the same page again on Retry", async () => {
    getSellerStories.mockResolvedValue({ success: false, message: "Boom" });
    await mount();
    await screen.findByText("Boom");

    getSellerStories.mockResolvedValue(listAnswer([story()]));
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByAltText("Story thumbnail"),
      "Retry should ask the stories server again and show what comes back",
    ).toBeInTheDocument();
  });
});

describe("Stories section — more pages", () => {
  it("shows no page controls for a single page", async () => {
    await mount();
    await screen.findByAltText("Story thumbnail");
    expect(
      screen.queryByRole("button", { name: /Next/ }),
      "one page of stories needs no page controls",
    ).not.toBeInTheDocument();
  });

  it("offers Next when meta says there is another page", async () => {
    getSellerStories.mockResolvedValue(
      listAnswer([story()], { current_page: 1, last_page: 3, total: 30 }),
    );
    await mount();
    await screen.findByAltText("Story thumbnail");

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(
        getSellerStories.mock.calls.at(-1),
        "Next should ask the stories server for page 2",
      ).toEqual([SELLER_ID, USER_ID, 2]);
    });
  });

  it("offers Next when the answer carries only a next_page_url", async () => {
    getSellerStories.mockResolvedValue({
      success: true,
      data: {
        data: [story()],
        meta: null,
        next_page_url: "https://stories.example/?page=2",
      },
    });
    await mount();
    await screen.findByAltText("Story thumbnail");
    expect(
      screen.getByRole("button", { name: /Next/ }),
      "a bare next_page_url is the stories server saying there is another page",
    ).toBeEnabled();
  });
});

describe("Stories section — deleting a story", () => {
  it("asks before deleting", async () => {
    await mount();
    await screen.findByAltText("Story thumbnail");

    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));

    expect(
      await screen.findByText("Delete Story"),
      "deleting a story should be confirmed first — it cannot be undone",
    ).toBeInTheDocument();
    expect(
      deleteSellerStory,
      "nothing should be deleted before the seller confirms",
    ).not.toHaveBeenCalled();
  });

  it("deletes nothing when the seller backs out", async () => {
    await mount();
    await screen.findByAltText("Story thumbnail");
    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));
    await screen.findByText("Delete Story");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      deleteSellerStory,
      "a cancelled delete must never reach the stories server",
    ).not.toHaveBeenCalled();
    expect(
      screen.getByAltText("Story thumbnail"),
      "the story should still be on screen after a cancelled delete",
    ).toBeInTheDocument();
  });

  it("names the story, the shop and the user in the delete request", async () => {
    deleteSellerStory.mockResolvedValue({ success: true });
    await mount();
    await screen.findByAltText("Story thumbnail");
    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));
    await screen.findByText("Delete Story");

    await userEvent.click(
      screen.getAllByRole("button", { name: /Delete/ }).at(-1)!,
    );

    await waitFor(() => {
      expect(
        deleteSellerStory,
        "the stories server needs the story id, the shop and the user",
      ).toHaveBeenCalledWith(1, SELLER_ID, USER_ID);
    });
  });

  it("takes the story off the grid once it is gone", async () => {
    deleteSellerStory.mockResolvedValue({ success: true });
    await mount();
    await screen.findByAltText("Story thumbnail");
    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));
    await screen.findByText("Delete Story");
    await userEvent.click(
      screen.getAllByRole("button", { name: /Delete/ }).at(-1)!,
    );

    await waitFor(() => {
      expect(
        screen.queryByAltText("Story thumbnail"),
        "a deleted story must not stay on the grid",
      ).not.toBeInTheDocument();
    });
  });

  it("keeps the story and reports why the stories server refused", async () => {
    deleteSellerStory.mockResolvedValue({
      success: false,
      message: "This story is still publishing.",
    });
    await mount();
    await screen.findByAltText("Story thumbnail");
    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));
    await screen.findByText("Delete Story");
    await userEvent.click(
      screen.getAllByRole("button", { name: /Delete/ }).at(-1)!,
    );

    await waitFor(() => {
      expect(
        useNotificationStore
          .getState()
          .notifications.map((n) => n.message),
        "a refused delete should be reported in the stories server's own words",
      ).toContain("This story is still publishing.");
    });
    expect(
      screen.getByAltText("Story thumbnail"),
      "a refused delete must not remove the story from the grid",
    ).toBeInTheDocument();
  });
});

describe("Stories section — the link on a new story", () => {
  /** Open Add Story and hand back its link field. */
  async function openUploadAndGetLinkField() {
    await mount();
    await screen.findByAltText("Story thumbnail");
    await userEvent.click(screen.getByRole("button", { name: /Add Story/ }));
    return (await screen.findAllByRole("textbox"))[0];
  }

  it("accepts a bare domain, which is how sellers usually type one", async () => {
    const field = await openUploadAndGetLinkField();
    await userEvent.type(field, "example.com");
    expect(
      screen.queryByText(
        "Please enter a valid URL (e.g., example.com or www.example.com)",
      ),
      "example.com is a link a seller may reasonably type",
    ).not.toBeInTheDocument();
  });

  it("accepts a full address", async () => {
    const field = await openUploadAndGetLinkField();
    await userEvent.type(field, "https://shop.example.com/sale");
    expect(
      screen.queryByText(
        "Please enter a valid URL (e.g., example.com or www.example.com)",
      ),
      "a full https address should be accepted",
    ).not.toBeInTheDocument();
  });

  it("refuses a word with no dot in it", async () => {
    const field = await openUploadAndGetLinkField();
    await userEvent.type(field, "notalink");
    expect(
      await screen.findByText(
        "Please enter a valid URL (e.g., example.com or www.example.com)",
      ),
      "a single word is not an address and the seller should be told while typing",
    ).toBeInTheDocument();
  });

  it("treats an empty link as fine, because the link is optional", async () => {
    const field = await openUploadAndGetLinkField();
    await userEvent.type(field, "x");
    await userEvent.clear(field);
    expect(
      screen.queryByText(
        "Please enter a valid URL (e.g., example.com or www.example.com)",
      ),
      "a story does not need a link, so an empty field is not an error",
    ).not.toBeInTheDocument();
  });
});

describe("Stories section — the permission gates", () => {
  it("hides Add Story without the create permission", async () => {
    await mount({ canCreate: false });
    await screen.findByAltText("Story thumbnail");
    expect(
      screen.queryByRole("button", { name: /Add Story/ }),
      "a seller who cannot create a story must not be offered Add Story",
    ).not.toBeInTheDocument();
  });

  it("hides the bin without the delete permission", async () => {
    await mount({ canDelete: false });
    await screen.findByAltText("Story thumbnail");
    expect(
      screen.queryByRole("button", { name: /Delete/ }),
      "a seller who cannot delete must not be offered a bin on a card",
    ).not.toBeInTheDocument();
  });

  it("still lets a seller with neither permission look at the stories", async () => {
    await mount({ canCreate: false, canDelete: false });
    expect(
      await screen.findByAltText("Story thumbnail"),
      "reading the stories needs neither permission",
    ).toBeInTheDocument();
  });
});

const notificationMessages = () =>
  useNotificationStore.getState().notifications.map((n) => n.message);

describe("Stories section — viewing a story", () => {
  it("opens a photo story large, with its link, product and date, and closes it", async () => {
    getSellerStories.mockResolvedValue(
      listAnswer([story({ link: "https://a.example", product_slug: "red-shoe" })]),
    );
    await mount();
    await userEvent.click(await screen.findByAltText("Story thumbnail"));

    expect(screen.getByAltText("Story"), "a photo story should open as a large picture").toBeInTheDocument();
    expect(screen.getByText(/Linked to product/), "the linked product should be named").toBeInTheDocument();
    const viewer = screen.getByAltText("Story").closest("[class*='bg-black/90']") as HTMLElement;
    expect(viewer.textContent, "the story's day should be shown in the viewer").toContain("2026-01-05");

    const link = screen.getAllByText("https://a.example").at(-1)!.closest("a") as HTMLAnchorElement;
    fireEvent.click(link);
    expect(screen.getByAltText("Story"), "a click on the link must not close the viewer").toBeInTheDocument();
    await userEvent.click(screen.getByAltText("Story"));
    expect(screen.getByAltText("Story"), "a click on the picture must not close the viewer").toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByAltText("Story"), "Close should end the viewer").not.toBeInTheDocument();

    await userEvent.click(screen.getByAltText("Story thumbnail"));
    await userEvent.click(screen.getByAltText("Story").closest("[class*='bg-black/90']") as HTMLElement);
    expect(screen.queryByAltText("Story"), "a click on the dark background should end the viewer").not.toBeInTheDocument();
  });

  it("plays a video story and shows a blank frame for a story with no media", async () => {
    getSellerStories.mockResolvedValue(
      listAnswer([
        story({ id: 1, is_video: 1, photo_path: null, full_video_path: "https://example.com/v.mp4" }),
        story({ id: 2, photo_path: null, full_video_path: null, created_at: undefined, viewers_count: undefined }),
      ]),
    );
    await mount();
    await screen.findByText("Video");
    const cards = document.querySelectorAll('[data-pw="seller-story-card"] > button');

    await userEvent.click(cards[0] as HTMLElement);
    expect(
      document.body.querySelector('video[autoplay]')?.getAttribute("src"),
      "a video story should open as a playing video",
    ).toBe("https://example.com/v.mp4");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    await userEvent.click(cards[1] as HTMLElement);
    expect(screen.queryByAltText("Story"), "a story with no media has no picture to show").not.toBeInTheDocument();
    expect(screen.getByText(/viewers/).textContent, "a story with no view count should show 0").toContain("0");
  });
});

describe("Stories section — Previous page", () => {
  it("asks for the page before after moving forward", async () => {
    getSellerStories.mockResolvedValue(listAnswer([story()], { current_page: 1, last_page: 2, total: 30 }));
    await mount();
    await screen.findByAltText("Story thumbnail");
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    await waitFor(() => expect(getSellerStories.mock.calls.at(-1)?.[2]).toBe(2));
    await userEvent.click(screen.getByRole("button", { name: /Previous/ }));
    await waitFor(() =>
      expect(getSellerStories.mock.calls.at(-1), "Previous should ask the stories server for page 1").toEqual([
        SELLER_ID,
        USER_ID,
        1,
      ]),
    );
  });
});

describe("Stories section — adding a story", () => {
  const realCreateObjectURL = URL.createObjectURL;
  const realRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:video");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    URL.createObjectURL = realCreateObjectURL;
    URL.revokeObjectURL = realRevokeObjectURL;
    vi.restoreAllMocks();
  });

  async function openUpload() {
    await mount();
    await screen.findByAltText("Story thumbnail");
    await userEvent.click(screen.getByRole("button", { name: /Add Story/ }));
    return document.querySelector('[data-pw="seller-story-file"]') as HTMLInputElement;
  }

  const pick = (input: HTMLInputElement, file: File | null) =>
    fireEvent.change(input, { target: { files: file ? [file] : [] } });

  const png = () => new File(["png"], "story.png", { type: "image/png" });

  it("opens the file picker from both upload buttons", async () => {
    const input = await openUpload();
    const click = vi.spyOn(input, "click");
    await userEvent.click(screen.getByRole("button", { name: /No media selected/ }));
    await userEvent.click(screen.getByRole("button", { name: /Upload Photo\/Video/ }));
    expect(click.mock.calls.length, "each upload button should open the picker").toBe(2);
  });

  it("closes from the Close button and from Cancel", async () => {
    await openUpload();
    await userEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);
    expect(screen.queryByText("No media selected"), "Close should end the upload window").not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Add Story/ }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("No media selected"), "Cancel should end the upload window").not.toBeInTheDocument();
  });

  it("refuses an SVG and a file above 10 MB, and ignores an empty or unknown pick", async () => {
    const input = await openUpload();
    pick(input, new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }));
    expect(notificationMessages(), "an SVG must be refused").toContain("SVG Images Not Allowed");

    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 10 * 1024 * 1024 + 1 });
    pick(input, big);
    expect(notificationMessages(), "a file above the limit must be refused").toContain(
      "File size should not exceed 10 MB",
    );

    pick(input, null);
    pick(input, new File(["t"], "notes.txt", { type: "text/plain" }));
    expect(screen.queryByTestId("crop"), "nothing usable was picked, so no editor opens").not.toBeInTheDocument();
    expect(screen.getByText("No media selected"), "the preview should still be empty").toBeInTheDocument();
  });

  it("sends a picture through the editor, and the editor can be closed without saving", async () => {
    const input = await openUpload();
    pick(input, png());
    await userEvent.click(await screen.findByRole("button", { name: "crop-close" }));
    expect(screen.queryByTestId("crop"), "closing the editor should take it away").not.toBeInTheDocument();
    expect(screen.getByText("No media selected"), "a closed editor leaves no preview").toBeInTheDocument();

    pick(input, png());
    await userEvent.click(await screen.findByRole("button", { name: "crop-save" }));
    expect(await screen.findByAltText("Preview"), "the saved picture should be previewed").toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change media/ }), "the picker button should now offer a change").toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("No media selected"), "Remove should clear the preview").toBeInTheDocument();
  });

  it("previews a short video and refuses one over a minute", async () => {
    const created: HTMLVideoElement[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string, opts?: any) => {
      const el = realCreate(tag, opts);
      if (tag === "video") created.push(el as HTMLVideoElement);
      return el;
    }) as any);

    const input = await openUpload();
    pick(input, new File(["v"], "long.mp4", { type: "video/mp4" }));
    const long = created.at(-1)!;
    Object.defineProperty(long, "duration", { value: 61 });
    long.onloadedmetadata!(new Event("loadedmetadata"));
    expect(notificationMessages(), "a video over a minute must be refused").toContain("1 minutes video only");

    pick(input, new File(["v"], "short.mp4", { type: "video/mp4" }));
    const short = created.at(-1)!;
    Object.defineProperty(short, "duration", { value: 20 });
    short.onloadedmetadata!(new Event("loadedmetadata"));
    await waitFor(() =>
      expect(
        document.querySelector('[data-pw="seller-story-upload"] video[controls]'),
        "a short video should be previewed as a video",
      ).toBeTruthy(),
    );
  });

  it("links a product, changes it and removes it", async () => {
    getSellerProducts
      .mockResolvedValueOnce({
        success: true,
        data: {
          products: [
            { id: 1, name: "Red Shoe", slug: "red-shoe", images: ["https://example.com/r.webp"] },
            { product_id: 2, name: "", images: [{ file_path: "https://example.com/b.webp" }] },
            { id: 3, name: "Hat", slug: "hat" },
          ],
          meta: { current_page: 1, last_page: 2 },
        },
      })
      .mockResolvedValueOnce({ success: true, data: [{ id: 4, name: "Scarf", slug: "scarf" }] });
    await openUpload();

    await userEvent.click(screen.getByRole("button", { name: /Link to Product/ }));
    expect(await screen.findByText("Red Shoe"), "the shop's products should be offered").toBeInTheDocument();
    expect(screen.getByText("Unnamed Product"), "a product with no name should still be pickable").toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("Scarf"), "Load more should add the next page").toBeInTheDocument();
    expect(getSellerProducts.mock.calls.at(-1), "Load more should ask for page 2").toEqual([SELLER_ID, 2]);
    expect(screen.getByText("Red Shoe"), "the first page must stay after Load more").toBeInTheDocument();

    await userEvent.click(screen.getByText("Red Shoe"));
    const chosen = document.querySelector('[data-pw="seller-story-product-chosen"]') as HTMLElement;
    expect(chosen?.textContent, "the picked product should be shown as linked").toContain("Red Shoe");
    expect(chosen.querySelector("img")?.getAttribute("src"), "its picture should be shown").toBe("https://example.com/r.webp");

    getSellerProducts.mockResolvedValue({
      success: true,
      data: { products: [{ id: 3, name: "Hat", slug: "hat" }] },
    });
    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    await userEvent.click(await screen.findByText("Hat"));
    expect(
      (document.querySelector('[data-pw="seller-story-product-chosen"]') as HTMLElement).textContent,
      "Change should replace the linked product",
    ).toContain("Hat");

    await userEvent.click(screen.getAllByRole("button", { name: "Remove" }).at(-1)!);
    expect(
      document.querySelector('[data-pw="seller-story-product-chosen"]'),
      "Remove should unlink the product",
    ).toBeNull();
  });

  it("closes the product picker from its Close button and its backdrop, and survives a failed load", async () => {
    getSellerProducts.mockResolvedValue({ success: false });
    await openUpload();
    await userEvent.click(screen.getByRole("button", { name: /Link to Product/ }));
    expect(await screen.findByText("No products found"), "a failed product load should show an empty list").toBeInTheDocument();
    await userEvent.click(screen.getByText("Select Product"));
    expect(screen.getByText("Select Product"), "a click inside must not close the picker").toBeInTheDocument();

    const pickerHeader = screen.getByText("Select Product").closest("div") as HTMLElement;
    await userEvent.click(pickerHeader.querySelector('button[aria-label="Close"]') as HTMLElement);
    expect(screen.queryByText("Select Product"), "Close should end the picker").not.toBeInTheDocument();

    getSellerProducts.mockRejectedValue("offline");
    await userEvent.click(screen.getByRole("button", { name: /Link to Product/ }));
    await screen.findByText("No products found");
    await userEvent.click(screen.getByText("Select Product").closest("[class*='bg-black/50']") as HTMLElement);
    expect(screen.queryByText("Select Product"), "the backdrop should end the picker").not.toBeInTheDocument();
  });

  it("uploads the picture, saves the story with its link and product, and reloads the list", async () => {
    getSellerProducts.mockResolvedValue({
      success: true,
      data: { products: [{ id: 1, name: "Red Shoe", slug: "red-shoe" }] },
    });
    uploadStoryToMediaServer.mockResolvedValue({ url: "/stories/new.png" });
    saveSellerStory.mockResolvedValue({ success: true });
    const input = await openUpload();

    pick(input, png());
    await userEvent.click(await screen.findByRole("button", { name: "crop-save" }));
    await screen.findByAltText("Preview");
    const link = document.querySelector('[data-pw="seller-story-link"]') as HTMLInputElement;
    await userEvent.type(link, "shop.example.com");
    fireEvent.blur(link);
    await userEvent.click(screen.getByRole("button", { name: /Link to Product/ }));
    await userEvent.click(await screen.findByText("Red Shoe"));
    const callsBefore = getSellerStories.mock.calls.length;

    await userEvent.click(screen.getByRole("button", { name: /Share Story/ }));

    await waitFor(() =>
      expect(notificationMessages(), "a saved story should be confirmed").toContain("Story uploaded successfully"),
    );
    expect(uploadStoryToMediaServer, "the picked file should go to the media server").toHaveBeenCalled();
    expect(saveSellerStory.mock.calls[0], "the stories server should get the media address, the link and the product").toEqual([
      SELLER_ID,
      USER_ID,
      {
        file_path: "https://example.com/stories/new.png",
        is_video: 0,
        link: "https://shop.example.com",
        product_id: 1,
        product_slug: "red-shoe",
        video_duration_in_seconds: null,
      },
    ]);
    expect(getSellerStories.mock.calls.length, "the list should be loaded again").toBeGreaterThan(callsBefore);
    expect(document.querySelector('[data-pw="seller-story-upload"]'), "the upload window should close").toBeNull();
  });

  it("keeps the window open and reports a refused save", async () => {
    uploadStoryToMediaServer.mockResolvedValue({ url: "/stories/new.png", durationSeconds: 12 });
    saveSellerStory.mockResolvedValue({ success: false });
    const input = await openUpload();
    pick(input, png());
    await userEvent.click(await screen.findByRole("button", { name: "crop-save" }));
    await screen.findByAltText("Preview");
    await userEvent.click(screen.getByRole("button", { name: /Share Story/ }));

    await waitFor(() =>
      expect(notificationMessages(), "a refused save should be reported").toContain("Upload Failed Try Again"),
    );
    expect(saveSellerStory.mock.calls[0][2], "an empty link is sent as null").toMatchObject({ link: null, product_id: null });
    expect(document.querySelector('[data-pw="seller-story-upload"]'), "the window should stay open to try again").toBeTruthy();
  });
});
