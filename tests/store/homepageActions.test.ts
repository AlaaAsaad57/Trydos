// store/homepage/actions.jsx — the story viewer's small actions: open a story
// (and report the view to analytics), move to the next or previous group, and
// find the first unseen item in a group.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GAevent = vi.hoisted(() => vi.fn());
vi.mock("utils/gtag", () => ({ GAevent }));

import StoryService from "services/story";
import auth from "services/auth";
import { useAppStore } from "store";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import {
  GetUnviewedStory,
  SelectStory,
  setNextStory,
  setPreviousStory,
} from "store/homepage/actions";

beforeEach(() => {
  vi.restoreAllMocks();
  GAevent.mockClear();
});

describe("SelectStory", () => {
  it("opens the story, marks the first item watched and reports a video view on the product screen", () => {
    const watch = vi.spyOn(StoryService, "WatchStory").mockResolvedValue(undefined);
    vi.spyOn(auth, "UserID").mockReturnValue(5 as any);
    const setSelectedStory = vi.fn();
    useAppStore.setState({ setSelectedStory } as any);
    window.history.pushState({}, "", "/sy-en/products/shirt");
    const story = {
      id: 3,
      stories: [{ id: 30, product_id: 7, full_video_path: "v.mp4", link: "https://x" }],
    };

    SelectStory(story);

    expect(watch, "the first item was not marked watched").toHaveBeenCalledWith(30, 3);
    expect(GAevent.mock.calls[0]?.[0], "the story view was not reported").toEqual({
      action: GA_EVENT_NAMES.VIEW_STORY,
      params: {
        user_id_custom: 5,
        story_id: 30,
        item_id: 7,
        item_name: 7,
        story_type: "video",
        link: "https://x",
        product_link: true,
        screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
        screen_path: "/sy-en/products/shirt",
      },
    });
    expect(setSelectedStory, "the story was not opened").toHaveBeenCalledWith(story);
  });

  it("reports a picture story on the home screen", () => {
    vi.spyOn(StoryService, "WatchStory").mockResolvedValue(undefined);
    useAppStore.setState({ setSelectedStory: vi.fn() } as any);
    window.history.pushState({}, "", "/sy-en");
    SelectStory({ id: 1, stories: [{ id: 10 }] });
    const params = GAevent.mock.calls[0]?.[0]?.params;
    expect([params?.story_type, params?.screen_name, params?.product_link], "the picture view is reported wrongly").toEqual([
      "image",
      GA_GLOBAL_SCREEN.HOME_SCREEN,
      false,
    ]);
  });

  it("closes the viewer without reporting anything", () => {
    const setSelectedStory = vi.fn();
    useAppStore.setState({ setSelectedStory } as any);
    SelectStory(null);
    expect(GAevent, "closing the viewer was reported as a view").not.toHaveBeenCalled();
    expect(setSelectedStory, "the viewer was not closed").toHaveBeenCalledWith(null);
  });
});

describe("setNextStory and setPreviousStory", () => {
  it("pass the current group to the store", () => {
    const nextStory = vi.fn();
    const prevStory = vi.fn();
    useAppStore.setState({ nextStory, prevStory } as any);
    setNextStory(4);
    setPreviousStory(5);
    expect(nextStory, "the next group was not asked for").toHaveBeenCalledWith(4);
    expect(prevStory, "the previous group was not asked for").toHaveBeenCalledWith(5);
  });
});

describe("GetUnviewedStory", () => {
  it("starts at the first unseen item", () => {
    expect(
      GetUnviewedStory({ stories: [{ id: 1, is_seen: true }, { id: 2, is_seen: false }, { id: 3, is_seen: false }] }),
      "the viewer did not start at the first unseen item",
    ).toBe(1);
  });

  it("starts at the beginning when everything was seen", () => {
    expect(
      GetUnviewedStory({ stories: [{ id: 1, is_seen: true }, { id: 2, is_seen: true }] }),
      "a fully seen group did not start at the beginning",
    ).toBe(0);
  });
});
