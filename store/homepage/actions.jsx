import { useAppStore } from "store";

/*Stories Actions */
// Opens a ring, or closes the viewer with `null`.
//
// It marks nothing and reports nothing. The viewer (StoryHolder) opens the ring
// on its first unseen story and marks and reports each story it shows. A mark
// here, before the viewer mounted, flagged item 0 as seen — so the viewer would
// skip it — and counted item 0 a second time.
export const SelectStory = (e) => {
  const { setSelectedStory } = useAppStore.getState();
  setSelectedStory(e);
};

export const setNextStory = (storyId) => {
  const { nextStory } = useAppStore.getState();

  nextStory(storyId);
};
export const setPreviousStory = (storyId) => {
  const { prevStory } = useAppStore.getState();
  prevStory(storyId);
};

export const GetUnviewedStory = (story) => {
  // if (typeof window !== "undefined") {
  //   const userStories = getCookie(COOKIE_NAMES.USER_STORIES);
  //   if (userStories && userStories?.id === story.id) {
  //     return story.stories.length - 1;
  //   }
  // }
  let index = 0;
  let unseen = [];
  story.stories.map((s, id) => {
    if (s.is_seen === false) {
      unseen.push(s);
    }
  });
  if (unseen.length > 0)
    story.stories.map((s, id) => {
      if (s.id === unseen[0].id) {
        index = id;
      }
    });

  return index;
};

