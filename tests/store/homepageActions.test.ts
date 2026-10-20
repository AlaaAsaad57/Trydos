// store/homepage/actions.jsx — the story viewer's small actions: open a story,
// move to the next or previous group, and find the first unseen item in a group.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GAevent = vi.hoisted(() => vi.fn());
vi.mock("utils/gtag", () => ({ GAevent }));

import StoryService from "services/story";
import { useAppStore } from "store";
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
  // The viewer (StoryHolder) opens a ring on its first unseen item, and marks
  // and reports the item it shows. So opening must not mark anything itself:
  // an early mark on item 0 made the viewer skip that item, and counted it twice.
  it("opens the story without marking or reporting an item, so the viewer starts on the first unseen one", () => {
    const watch = vi.spyOn(StoryService, "WatchStory").mockResolvedValue(undefined);
    const setSelectedStory = vi.fn();
    useAppStore.setState({ setSelectedStory } as any);
    const story = { id: 3, stories: [{ id: 30, is_seen: false }, { id: 31, is_seen: false }] };

    SelectStory(story);

    expect(
      watch,
      "opening a ring marked its first item watched before the viewer showed it, so the viewer skips that item",
    ).not.toHaveBeenCalled();
    expect(GAevent, "opening a ring reported a view before the viewer showed any item").not.toHaveBeenCalled();
    expect(setSelectedStory, "the story was not opened").toHaveBeenCalledWith(story);
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
