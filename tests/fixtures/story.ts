// Builders for a story and one story item.
//
// Where the shape comes from (C-5): the `Story` interface in
// store/homepage/reducer.ts — the shape the home store keeps in `storiesData`.
// That interface is not exported, so the two shapes below repeat it here and
// name their source. Nothing is imported, so no production module is loaded.

/** One item inside a story ring. */
export interface StoryItem {
  id: string | number;
  is_seen: boolean;
}

/** One story ring, as the home store holds it. */
export interface Story {
  id: string | number;
  stories: StoryItem[];
}

export function buildStoryItem(overrides: Partial<StoryItem> = {}): StoryItem {
  return {
    id: "test-story-item-1",
    is_seen: false,
    ...overrides,
  };
}

/** A story ring. By default it holds one unseen item. */
export function buildStory(overrides: Partial<Story> = {}): Story {
  return {
    id: "test-story-1",
    stories: [buildStoryItem()],
    ...overrides,
  };
}
