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
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSellerStories = vi.fn();
const deleteSellerStory = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerStories: (...a: unknown[]) => getSellerStories(...a),
    deleteSellerStory: (...a: unknown[]) => deleteSellerStory(...a),
    getSellerProducts: vi.fn(async () => ({ success: true, data: { products: [] } })),
    uploadStoryToMediaServer: vi.fn(),
    saveSellerStory: vi.fn(),
  },
}));

// The crop widget is only reached after a picture is chosen, and it pulls in
// canvas work jsdom cannot do. Nothing below chooses a picture.
vi.mock("components/global/ImageCropWidget", () => ({
  ImageCropWidget: () => null,
}));

import StoriesTab from "components/SellerDashboard/StoriesTab";
import { useNotificationStore } from "store/notifications/reducer";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

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
