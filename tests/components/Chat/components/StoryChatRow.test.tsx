// One row of the stories tab in the chat window
// (components/Chat/components/StoryChatRow.jsx).
//
// BUG-C-74. In Arabic and Kurdish the chats tab mirrors its rows (ChatItem:
// `flex-row-reverse` on the row and `dir-rtl` on the name, keyed on the store
// `language`). The stories tab has to do the same: the story circle on the
// right and the author name next to it, on its left. English and Turkish stay
// left to right.
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

vi.mock("services/story", () => ({
  default: {
    configureStory: (s: any) => s,
    getThumb: () => "https://example.com/thumb.jpg",
    authorName: () => "Alaa Test123",
  },
}));

import StoryChatRow from "components/Chat/components/StoryChatRow";

const story = { id: 1, stories: [{ id: 10, is_seen: false, photo_path: "s.jpg" }] };

async function renderIn(language: "en" | "ar" | "tr" | "ku") {
  const r = await renderWithProviders(
    <StoryChatRow
      story={story}
      stories={story}
      index={0}
      viewedStory={story.stories[0]}
      select={() => {}}
    />,
    { language },
  );
  return {
    row: r.container.querySelector(".call-conversation-item") as HTMLElement | null,
    name: r.container.querySelector(".story-name") as HTMLElement | null,
  };
}

describe("StoryChatRow — right-to-left languages", () => {
  for (const language of ["ar", "ku"] as const) {
    it(`mirrors the story row in ${language}, the same way the chats tab does`, async () => {
      const { row, name } = await renderIn(language);

      expect(
        row?.className,
        `in ${language} the story row did not reverse, so the story circle stayed on the left (class "${row?.className}")`,
      ).toContain("flex-row-reverse");
      expect(
        name?.className,
        `in ${language} the author name was not set right to left (class "${name?.className}")`,
      ).toContain("dir-rtl");
      expect(
        name?.style.marginRight,
        `in ${language} the gap between the circle and the name was not on the circle's side (the right of the name)`,
      ).toBe("5px");
    });
  }

  for (const language of ["en", "tr"] as const) {
    it(`keeps the story row left to right in ${language}`, async () => {
      const { row, name } = await renderIn(language);

      expect(
        row?.className,
        `in ${language} the story row was reversed, but ${language} reads left to right`,
      ).not.toContain("flex-row-reverse");
      expect(
        name?.className,
        `in ${language} the author name was set right to left`,
      ).not.toContain("dir-rtl");
      expect(
        name?.style.marginLeft,
        `in ${language} the gap between the circle and the name moved off the left of the name`,
      ).toBe("5px");
    });
  }
});
