import { describe, expect, it, vi, beforeEach } from "vitest";
import StoryServiceClass from "services/story";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

// The story bar greys out a ring once every story item inside it carries
// is_seen: true (components/Home/Stories/StoryElement.tsx). Marking the item
// seen is a local, visual job — it must not depend on being signed in.
const GROUP_ID = 77;
const ITEM_ID = 901;

const seedOneUnseenStory = () => {
  useAppStore.setState({
    storiesData: [
      {
        id: GROUP_ID,
        stories: [
          { id: ITEM_ID, is_seen: false },
          { id: 902, is_seen: false },
        ],
      },
    ],
  } as any);
};

const seenFlagOf = (itemId: number) => {
  const group = useAppStore
    .getState()
    .storiesData?.find((s: any) => s.id === GROUP_ID);
  return group?.stories.find((i: any) => i.id === itemId)?.is_seen;
};

describe("StoryService.WatchStory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedOneUnseenStory();
  });

  describe("guest viewer (no stories account)", () => {
    beforeEach(() => {
      useAppStore.setState({ userStories: null } as any);
    });

    it("marks the watched story item as seen in the store", async () => {
      await StoryServiceClass.WatchStory(ITEM_ID, GROUP_ID);

      expect(
        seenFlagOf(ITEM_ID),
        "a guest watched the story but the store still has is_seen: false, so the ring never greys out",
      ).toBe(true);
    });

    it("leaves the other story items in the group untouched", async () => {
      await StoryServiceClass.WatchStory(ITEM_ID, GROUP_ID);

      expect(
        seenFlagOf(902),
        "watching one item wrongly marked a different item of the same group as seen",
      ).toBe(false);
    });

    it("calls no stories backend endpoint", async () => {
      await StoryServiceClass.WatchStory(ITEM_ID, GROUP_ID);

      expect(
        fetchData,
        "a guest has no stories token, so the stories backend must not be called at all",
      ).not.toHaveBeenCalled();
    });
  });

  describe("signed-in viewer (has a stories account)", () => {
    beforeEach(() => {
      useAppStore.setState({ userStories: { id: 5, need_auth: false } } as any);
      vi.mocked(fetchData).mockResolvedValue({ success: true } as any);
    });

    it("marks the watched story item as seen in the store", async () => {
      await StoryServiceClass.WatchStory(ITEM_ID, GROUP_ID);

      expect(
        seenFlagOf(ITEM_ID),
        "a signed-in viewer watched the story but the store still has is_seen: false",
      ).toBe(true);
    });

    it("reports the view to the stories backend", async () => {
      await StoryServiceClass.WatchStory(ITEM_ID, GROUP_ID);

      expect(
        fetchData,
        "the stories backend was not told about the view, so the viewer count stays wrong",
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `/api/v1/stories/increase_viewers/${ITEM_ID}`,
          server: "stories",
          method: "GET",
        }),
      );
    });

    it("keeps the story marked as seen even when the stories backend refuses", async () => {
      vi.mocked(fetchData).mockResolvedValue({
        success: false,
        message: "stories backend rejected increase_viewers",
      } as any);

      await StoryServiceClass.WatchStory(ITEM_ID, GROUP_ID);

      expect(
        seenFlagOf(ITEM_ID),
        "the stories backend refused the view count and the local seen flag was rolled back with it",
      ).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// The QA lock for stories (AC-6, AC-20).
//
// A story carries no shop, so the product mark does not reach it. The mark a
// story carries is its **link**: a QA story links to the QA host.
//
// Two different claims are proved here, and they are not the same thing:
//
//   AC-6  the filter itself works — right level of nesting, keeps real stories,
//         never throws on a link it cannot read;
//   AC-20 every live reader actually calls it. A perfect filter that one of the
//         four readers forgot is a QA story on somebody's home page.
// ---------------------------------------------------------------------------

describe("the web feed drops a QA-linked story", () => {
  const QA_HOST = "qa-test.trydos.tech";

  /** One author with three stories: a QA one between two real ones. */
  const mixedGroup = () => ({
    id: 500,
    name: "A real person",
    stories: [
      { id: 1, link: "https://trydos.com/product/real-one", is_seen: false },
      { id: 2, link: `https://${QA_HOST}/qa-product`, is_seen: false },
      { id: 3, link: "", is_seen: false },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ storiesData: [] } as any);
  });

  it("removes the QA story and keeps the real ones beside it", async () => {
    (fetchData as any).mockResolvedValue({
      success: true,
      data: { data: [mixedGroup()], next_page_url: null },
    });

    const result = await StoryServiceClass.getStories(1);

    const ids = (result.data?.[0]?.stories ?? []).map((s: any) => s.id);
    expect(
      ids,
      "the story feed did not drop exactly the QA-linked story. A filter at the wrong nesting level either removes the whole author or removes nothing",
    ).toEqual([1, 3]);
  });

  it("writes the filtered feed to the store, not the raw answer", async () => {
    // The store is what the bar renders. Filtering the returned value alone
    // would leave the QA story on screen.
    (fetchData as any).mockResolvedValue({
      success: true,
      data: { data: [mixedGroup()], next_page_url: null },
    });

    await StoryServiceClass.getStories(1);

    const stored = useAppStore.getState().storiesData as any[];
    const storedIds = (stored?.[0]?.stories ?? []).map((s: any) => s.id);
    expect(
      storedIds,
      "the QA story reached the store even though the returned value was filtered, so the stories bar would show it",
    ).toEqual([1, 3]);
  });

  it("drops an author whose only story was a QA one", async () => {
    // Keeping the author leaves an empty ring on the bar that opens onto
    // nothing — worse than showing the story, because it looks broken.
    (fetchData as any).mockResolvedValue({
      success: true,
      data: {
        data: [
          { id: 600, stories: [{ id: 9, link: `https://${QA_HOST}/only` }] },
          { id: 601, stories: [{ id: 10, link: "https://trydos.com/x" }] },
        ],
        next_page_url: null,
      },
    });

    const result = await StoryServiceClass.getStories(1);

    expect(
      result.data.map((group: any) => group.id),
      "an author left with no stories after filtering still has a tile on the stories bar",
    ).toEqual([601]);
  });

  it("keeps a story whose link cannot be read, and does not throw", async () => {
    // A throw here is expensive out of proportion: the server reader returns an
    // empty feed and writes one error report per request, and the client bar
    // stays on its skeleton for ever.
    (fetchData as any).mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 700,
            stories: [
              { id: 11, link: "not a url at all ((" },
              { id: 12, link: null },
              { id: 13 },
            ],
          },
        ],
        next_page_url: null,
      },
    });

    const result = await StoryServiceClass.getStories(1);

    expect(
      (result.data?.[0]?.stories ?? []).map((s: any) => s.id),
      "a malformed, null or absent story link was treated as QA data and removed, or made the filter throw",
    ).toEqual([11, 12, 13]);
  });

  it("does not mistake a host that merely contains the QA name", async () => {
    (fetchData as any).mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 800,
            stories: [
              { id: 21, link: `https://not-${QA_HOST}.example.com/x` },
              { id: 22, link: `https://trydos.com/${QA_HOST}` },
            ],
          },
        ],
        next_page_url: null,
      },
    });

    const result = await StoryServiceClass.getStories(1);

    expect(
      (result.data?.[0]?.stories ?? []).map((s: any) => s.id),
      "a real story was removed because its address mentioned the QA host somewhere other than the host part",
    ).toEqual([21, 22]);
  });
});

describe("every live reader applies the QA story filter", () => {
  // A source-text check, and it is the right shape for this claim. The four
  // readers run in four different places — two on the server, two in the
  // browser — and what has to be true is the same sentence about all four:
  // each one passes its feed through the shared helper. Driving each reader
  // separately would prove four smaller things and still not prove this one.
  const READERS = [
    "services/story.ts",
    "serverRequests/stories.ts",
    "components/Home/Stories/StoriesBarClient.tsx",
    "components/Home/Stories/StoriesPaginationWrapper.tsx",
  ];

  it.each(READERS)("%s calls dropQaStories", async (path) => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");

    const source = readFileSync(resolve(process.cwd(), path), "utf8");

    expect(
      source.includes("dropQaStories"),
      `${path} reads the story feed and never passes it through dropQaStories, so a QA story reaches whatever it feeds`,
    ).toBe(true);
  });
});
