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
