import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StoryServiceClass from "services/story";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

// The upload ticket comes from our own /api/ticket route; the upload tests only
// need to see it handed to the media server.
const GetTicket = vi.hoisted(() => vi.fn(async (..._a: any[]) => "ticket-1"));
vi.mock("utils/UploadUtils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return { ...actual, GetTicket };
});

// The error reporter reads the store and cookies; the tests below only need to
// see that a failure was reported.
const LogErrorSpy = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return { ...actual, LogError: LogErrorSpy };
});

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

describe("the viewer allow-list does not weaken the feed's default", () => {
  // AC-1. The list is the one way a QA story is ever shown, and it is empty on
  // every build a customer can reach. This pins the default: a signed-in viewer,
  // with no list configured, still sees nothing.
  const QA_HOST = "qa-test.trydos.tech";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    useAppStore.setState({
      storiesData: [],
      userProfile: { phone: "999000000001" },
    } as any);
  });

  it("with no viewer list, a QA story is still dropped for a signed-in viewer", async () => {
    (fetchData as any).mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 500,
            stories: [
              { id: 1, link: "https://trydos.com/real", is_seen: false },
              { id: 2, link: `https://${QA_HOST}/e2e/tok/photo`, is_seen: false },
            ],
          },
        ],
        next_page_url: null,
      },
    });

    const result = await StoryServiceClass.getStories(1);

    expect(
      (result.data?.[0]?.stories ?? []).map((s: any) => s.id),
      "a QA story reached a signed-in viewer with NEXT_PUBLIC_QA_STORY_VIEWER_PHONES unset. Unset is the state of every deployed build, so this is test content on a real customer's screen",
    ).toEqual([1]);
  });
});

describe("no story reader can skip the QA filter", () => {
  // AC-16. `fetchStoriesForGuest` read the feed and never filtered it. It had no
  // caller, so it was a hole waiting for one. It is deleted rather than fixed:
  // a reader that does not exist cannot skip the rule, and the repository
  // forbids writing a test for code nothing calls.
  it("serverRequests/stories.ts no longer exports an unfiltered guest reader", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");

    const source = readFileSync(
      resolve(process.cwd(), "serverRequests/stories.ts"),
      "utf8",
    );

    expect(
      source.includes("fetchStoriesForGuest"),
      "fetchStoriesForGuest is back in serverRequests/stories.ts. It read the story feed and never called dropQaStories, so whatever starts calling it shows QA stories to everybody",
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The rest of the stories service: paging, upload, delete, report, and the
// shape the story viewer reads.
// ---------------------------------------------------------------------------

describe("StoryService.getStories — paging and failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends a later page to the feed already in the store", async () => {
    useAppStore.setState({ storiesData: [{ id: 1, stories: [] }] } as any);
    (fetchData as any).mockResolvedValue({
      success: true,
      data: { data: [{ id: 2, stories: [{ id: 5, link: "" }] }], next_page_url: "p3" },
    });
    const out = await StoryServiceClass.getStories(2);
    expect(
      (useAppStore.getState().storiesData as any[]).map((g) => g.id),
      "page 2 did not go after page 1 in the store",
    ).toEqual([1, 2]);
    expect(out.next_page_url, "the next page address was lost").toBe("p3");
  });

  it("reports and throws when the stories backend refuses", async () => {
    (fetchData as any).mockResolvedValue({ success: false, message: "Unauthorized" });
    await expect(StoryServiceClass.getStories(1), "a refused feed did not throw").rejects.toThrow(
      "get stories error",
    );
    expect(LogErrorSpy.mock.calls[0]?.[0]?.scenario, "the stories backend refusal was not reported").toBe(
      "Error in getStories in services/story",
    );
  });
});

describe("StoryService upload to the media server", () => {
  const MEDIA = "https://example.com";

  /** Load a fresh copy with a media API key, which the test env leaves empty. */
  async function loadWithKey(key = "media-key") {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_API_KEY", key);
    vi.resetModules();
    const mod = await import("services/story");
    return mod.default;
  }

  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("refuses to upload when the media server is not configured", async () => {
    await expect(
      StoryServiceClass.uploadToMediaServer(new File(["x"], "a.png", { type: "image/png" })),
      "an upload ran with no media API key",
    ).rejects.toThrow("Media server upload is not configured");
  });

  it("uploads a video with a story ticket and returns its address and length", async () => {
    const service = await loadWithKey();
    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ url: "/v/1.mp4", durationSeconds: 12 }) });
    const out = await service.uploadToMediaServer(new File(["x"], "a.mp4", { type: "video/mp4" }));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url, "a video did not go to the story upload address").toBe(`${MEDIA}/gated/upload?story=true`);
    expect(init.headers, "the media server did not get the key and the ticket").toEqual({
      "x-api-key": "media-key",
      "X-Upload-Ticket": "ticket-1",
    });
    expect(GetTicket, "the ticket was not asked for a story video").toHaveBeenCalledWith("stories", true, 1);
    expect(out, "the upload result is wrong").toEqual({ url: "/v/1.mp4", durationSeconds: 12 });
  });

  it("uploads a picture to the plain address", async () => {
    const service = await loadWithKey();
    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ url: "/i/1.png" }) });
    await service.uploadToMediaServer(new File(["x"], "a.png", { type: "image/png" }));
    expect(fetchSpy.mock.calls[0][0], "a picture went to the video address").toBe(`${MEDIA}/gated/upload`);
  });

  it("fails when the media server refuses, answers no JSON, or gives no address", async () => {
    const service = await loadWithKey();
    const file = new File(["x"], "a.png", { type: "image/png" });
    fetchSpy
      .mockResolvedValueOnce({ ok: false, json: async () => ({ url: "/x" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => { throw new Error("not json"); } })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    for (const why of ["a refusal", "a body that is not JSON", "a body with no address"]) {
      await expect(service.uploadToMediaServer(file), `${why} did not fail the upload`).rejects.toThrow(
        "Media server upload failed",
      );
    }
  });

  it("adds the uploaded story to the stories backend and closes the upload", async () => {
    const service = await loadWithKey();
    const { fetchData: freshFetchData } = await import("utils/fetchData");
    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ url: "/v/1.mp4", durationSeconds: "9.7" }) });
    (freshFetchData as any).mockResolvedValue({ success: true, data: { id: 44 } });
    const endUpload = vi.fn();
    const out = await service.upload(
      new File(["x"], "a.mp4", { type: "video/mp4" }),
      () => {},
      1,
      endUpload,
      "https://trydos.com/p/1",
    );
    const body = JSON.parse((freshFetchData as any).mock.calls[0][0].body);
    expect(body, "the story sent to the stories backend is wrong").toEqual({
      file_path: `${MEDIA}/v/1.mp4`,
      video_duration_in_second: 9,
      is_video: 1,
      link: "https://trydos.com/p/1",
    });
    expect(endUpload, "the upload was not closed").toHaveBeenCalled();
    expect(out, "the new story was not returned").toEqual({ id: 44 });
  });

  it("reports and throws when the stories backend refuses the story, or returns nothing", async () => {
    const service = await loadWithKey();
    const { fetchData: freshFetchData } = await import("utils/fetchData");
    const { LogError } = await import("utils/functions");
    fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ url: "/i/1.png" }) });
    (freshFetchData as any)
      .mockResolvedValueOnce({ success: false, message: "too big" })
      .mockResolvedValueOnce({ success: true, data: null });
    const file = new File(["x"], "a.png", { type: "image/png" });
    await expect(service.upload(file, () => {}, 0, () => {}, ""), "a refused story did not throw").rejects.toThrow(
      "too big",
    );
    await expect(service.upload(file, () => {}, 0, () => {}, ""), "an empty answer did not throw").rejects.toThrow(
      "Failed",
    );
    expect((LogError as any).mock.calls[0]?.[0]?.scenario, "the failed upload was not reported").toBe(
      "Error in upload in services/story",
    );
  });
});

describe("StoryService.deleteStory and reportStory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a story and returns the stories backend answer", async () => {
    (fetchData as any).mockResolvedValue({ success: true, data: { deleted: true } });
    expect(await StoryServiceClass.deleteStory(7), "the delete answer was not returned").toEqual({ deleted: true });
    expect(JSON.parse((fetchData as any).mock.calls[0][0].body), "the wrong story was deleted").toEqual({
      story_id: 7,
    });
  });

  it("throws when the stories backend refuses the delete", async () => {
    (fetchData as any).mockResolvedValue({ success: false, message: "not yours" });
    await expect(StoryServiceClass.deleteStory(7), "a refused delete did not throw").rejects.toThrow("not yours");
    expect(LogErrorSpy.mock.calls[0]?.[0]?.scenario, "the refused delete was not reported").toBe(
      "Error in deleteStory in services/story",
    );
  });

  it("reports a story with its reasons and notes", async () => {
    (fetchData as any).mockResolvedValue({ success: true, data: { id: 1 } });
    expect(await StoryServiceClass.reportStory(7, "u5", ["spam"], "looks fake"), "the report answer was not returned").toEqual({
      id: 1,
    });
    expect(JSON.parse((fetchData as any).mock.calls[0][0].body), "the report body is wrong").toEqual({
      story_id: 7,
      reasons: ["spam"],
      notes: "looks fake",
      reporter_user_id: "u5",
    });
  });

  it("throws when the stories backend refuses the report", async () => {
    (fetchData as any).mockResolvedValue({ success: false, message: "already reported" });
    await expect(
      StoryServiceClass.reportStory(7, "u5", [], ""),
      "a refused report did not throw",
    ).rejects.toThrow("already reported");
  });
});

describe("StoryService helpers for the story viewer", () => {
  it("getUserStories reads the stories account from the store", () => {
    useAppStore.setState({ userStories: { id: 5 } } as any);
    expect(StoryServiceClass.getUserStories(), "the stories account was not read").toEqual({ id: 5 });
  });

  it("configureStory builds video and picture slides and drops the rest", () => {
    const out = StoryServiceClass.configureStory({
      name: "Shop",
      photo_path: "https://cdn.example.com/p.png",
      stories: [
        { id: 1, full_video_path: "v/1.mp4", video_duration_in_second: 9, created_at: "2020-01-01T00:00:00Z" },
        { id: 2, photo_path: "https://cdn.example.com/upload/i.png", created_at: "2020-01-01T00:00:00Z" },
        { id: 3, photo_path: "/upload/j.png" },
        { id: 4, full_video_path: "https://cdn.example.com/v.mp4" },
        { id: 5 },
      ],
    });
    expect(out.stories.map((s: any) => [s.id, s.type]), "the slides are wrong").toEqual([
      [1, "video"],
      [2, "image"],
      [3, "image"],
      [4, "video"],
    ]);
    expect(out.stories[0].url, "a relative video path was not put on the media server").toBe(
      "https://example.com/v/1.mp4",
    );
    expect(out.stories[1].url, "the picture was not resized").toBe(
      "https://cdn.example.com/upload/w_720,c_pad/f_auto/q_auto:good/i.png",
    );
    expect(out.stories[2].url, "a leading-slash picture path is wrong").toBe(
      "https://example.com/upload/w_720,c_pad/f_auto/q_auto:good/j.png",
    );
    expect(out.stories[3].url, "a full video address was changed").toBe("https://cdn.example.com/v.mp4");
    expect(out.stories[0].header.heading, "the author name is missing").toBe("Shop");
    expect(out.stories[0].header.profileImage, "the author picture is missing").toBe(
      "https://cdn.example.com/p.png",
    );
  });

  it("configureStory falls back to the phone, then to 'Unknown', and to the default picture", async () => {
    const byPhone = StoryServiceClass.configureStory({
      mobile_phone: "x",
      stories: [{ id: 1, full_video_path: "v.mp4" }, { id: 2, photo_path: "i.png" }],
    });
    const nobody = StoryServiceClass.configureStory({
      stories: [{ id: 1, full_video_path: "v.mp4" }, { id: 2, photo_path: "i.png" }],
    });
    expect(byPhone.stories.map((s: any) => s.header.heading), "the phone fallback is wrong").toEqual(["x", "x"]);
    expect(nobody.stories.map((s: any) => s.header.heading), "the Unknown fallback is wrong").toEqual([
      "Unknown",
      "Unknown",
    ]);
    // The runner loads the picture import as a plain value, so compare with the
    // same `.src` read the service does rather than with a fixed address.
    const fallback = ((await import("public/images/profileNo.png")) as any).default?.src;
    expect(nobody.stories[1].header.profileImage, "the default picture was not used").toBe(fallback);
    expect(StoryServiceClass.configureStory(null).stories, "a missing story did not give no slides").toEqual([]);
  });

  it("getThumb picks a video snapshot or a small picture, and nothing without an address", () => {
    expect(StoryServiceClass.getThumb("https://x/v.mp4", true), "the video thumb is wrong").toBe(
      "https://x/v.mp4?target=snapshot",
    );
    expect(StoryServiceClass.getThumb("https://x/upload/i.png", false), "the picture thumb is wrong").toBe(
      "https://x/upload/h_194/f_webp/q_100/i.png",
    );
    expect(StoryServiceClass.getThumb("", false), "an empty address got a thumb").toBeUndefined();
  });
});
