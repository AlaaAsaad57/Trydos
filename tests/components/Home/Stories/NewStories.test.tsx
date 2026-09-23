import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const SelectStory = vi.fn();
vi.mock("store/homepage/actions", () => ({ SelectStory: (...a: any[]) => SelectStory(...a) }));
vi.mock("services/story", () => ({ default: { configureStory: (s: any) => ({ ...s, configured: true }) } }));
const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
vi.mock("components/global/ParamsUpdater", () => ({ default: () => null }));
vi.mock("components/Home/Stories/StoryHolder", () => ({
  default: ({ story, active }: any) => (
    <div data-testid={`holder-${story.id}`} data-active={String(active)} data-configured={String(story.configured)} />
  ),
}));

// The cube stand-in draws every pane and offers "go to pane i" buttons, which is
// how the real cube reports a finished swipe.
let cubeProps: any = null;
vi.mock("components/Home/Stories/CubeCarousel", () => ({
  default: (p: any) => {
    cubeProps = p;
    return (
      <div data-testid="cube" data-index={p.index} data-gestures={String(p.enableGestures)}>
        {[-1, 0, 1, 2, 3].map((i) => (
          <div key={i}>{p.renderItem(i, i === p.index)}</div>
        ))}
      </div>
    );
  },
}));

// react-swipeable is replaced by a stand-in that exposes its callbacks, so the
// pull-down-to-close gesture is driven step by step.
let swipe: any = null;
vi.mock("react-swipeable", () => ({
  useSwipeable: (config: any) => {
    swipe = config;
    return {};
  },
}));

import StoriesContainer from "components/Home/Stories/NewStories";

const people = [{ id: 1 }, { id: 2 }, { id: 3 }];
const layout = () => document.querySelector(".fixed-layout") as HTMLDivElement;

describe("StoriesContainer (NewStories)", () => {
  beforeEach(() => {
    SelectStory.mockReset();
    GAevent.mockReset();
    vi.stubGlobal("visualViewport", { height: 700 });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows a spinner while the selected story is not in the list", async () => {
    const { container } = await renderWithProviders(<StoriesContainer selectedStory={{ id: 9 }} stories={people} />);
    expect(container.querySelector(".fixed-layout"), "the viewer opened for a story it does not have").toBeNull();
    expect(GAevent.mock.calls[0]?.[0].params.screen_name, "the story screen view was not reported").toBeTruthy();
  });

  it("shows a spinner when there are no stories anywhere", async () => {
    const { container } = await renderWithProviders(<StoriesContainer selectedStory={{ id: 1 }} />, {
      store: { storiesData: null },
    });
    expect(container.querySelector(".fixed-layout"), "the viewer opened with no stories").toBeNull();
  });

  it("opens on the selected author from the store cache and moves with the cube", async () => {
    const { rerender } = await renderWithProviders(<StoriesContainer selectedStory={{ id: 2 }} />, {
      store: { storiesData: people },
    });
    expect(screen.getByTestId("cube").dataset.index, "the cube did not open on the selected author").toBe("1");
    expect(screen.getByTestId("holder-2").dataset.active, "the selected author is not in front").toBe("true");
    expect(screen.getByTestId("holder-2").dataset.configured, "the story was not prepared before showing").toBe("true");
    expect(layout().style.height, "the viewer does not fill the visible height").toBe("700px");

    act(() => cubeProps.onChange(2));
    expect(SelectStory, "a swipe to the next pane did not select that author").toHaveBeenCalledWith(people[2]);
    expect(screen.getByTestId("cube").dataset.index, "the cube did not follow the swipe").toBe("2");
    act(() => cubeProps.onChange(5));
    expect(SelectStory, "a swipe past the end selected something").toHaveBeenCalledTimes(1);
    expect(cubeProps.hasNext(1), "the middle author should have a next one").toBe(true);
    expect(cubeProps.hasNext(2), "the last author should have no next one").toBe(false);

    rerender(<StoriesContainer selectedStory={{ id: 1 }} />);
    expect(screen.getByTestId("cube").dataset.index, "an outside change of author did not move the cube").toBe("0");
    rerender(<StoriesContainer selectedStory={{ id: 1, again: true }} />);
    expect(screen.getByTestId("cube").dataset.index, "the same author moved the cube").toBe("0");
  });

  it("closes the viewer on a long pull down", async () => {
    vi.useFakeTimers();
    await renderWithProviders(<StoriesContainer selectedStory={{ id: 1 }} stories={people} />);
    act(() => swipe.onTouchStartOrOnMouseDown({}));
    expect(layout().style.transition, "the pull did not stop the slide animation").toBe("0s");
    act(() => swipe.onSwiping({ dir: "Down", deltaY: window.innerHeight * 0.5 }));
    expect(layout().style.transform, "the viewer did not follow the finger").toBe("translateY(50%)");
    expect(screen.getByTestId("cube").dataset.gestures, "the cube still took gestures during a pull down").toBe("false");
    act(() => swipe.onSwiping({ dir: "Down", deltaY: window.innerHeight * 0.5 }));
    act(() => swipe.onTouchEndOrOnMouseUp({}));
    expect(layout().style.transform, "a long pull did not slide the viewer away").toBe("translateY(100%)");
    act(() => vi.advanceTimersByTime(150));
    expect(SelectStory, "a long pull did not close the viewer").toHaveBeenCalledWith(null);
  });

  it("springs back on a short pull, and ignores sideways swipes and tiny moves", async () => {
    await renderWithProviders(<StoriesContainer selectedStory={{ id: 1 }} stories={people} />);
    act(() => swipe.onTouchStartOrOnMouseDown({}));
    // The first move marks "pulling down" and re-renders; the handlers of the
    // new render carry the rest of the gesture, as the real library does.
    act(() => swipe.onSwiping({ dir: "Down", deltaY: window.innerHeight * 0.1 }));
    act(() => swipe.onSwiping({ dir: "Down", deltaY: window.innerHeight * 0.1 }));
    act(() => swipe.onTouchEndOrOnMouseUp({}));
    expect(layout().style.transform, "a short pull did not spring back").toBe("translateY(0%)");
    expect(SelectStory, "a short pull closed the viewer").not.toHaveBeenCalled();

    act(() => swipe.onTouchStartOrOnMouseDown({}));
    act(() => swipe.onSwiping({ dir: "Left", deltaY: 0 }));
    act(() => swipe.onTouchEndOrOnMouseUp({}));
    act(() => swipe.onSwiping({ dir: "Down", deltaY: 1 }));
    act(() => swipe.onTouchEndOrOnMouseUp({}));
    expect(SelectStory, "a sideways swipe or a tiny move closed the viewer").not.toHaveBeenCalled();

    // A move and a release inside one render: the "pulling down" mark is not
    // set yet, so the release must not close the viewer.
    act(() => {
      swipe.onSwiping({ dir: "Down", deltaY: window.innerHeight * 0.5 });
      swipe.onTouchEndOrOnMouseUp({});
    });
    expect(SelectStory, "a release before the pull was marked closed the viewer").not.toHaveBeenCalled();
  });

  it("puts the viewer back when the pointer leaves it", async () => {
    await renderWithProviders(<StoriesContainer selectedStory={{ id: 1 }} stories={people} />);
    layout().style.transform = "translateY(40%)";
    fireEvent.pointerLeave(layout());
    expect(layout().style.transform, "leaving with the pointer did not reset the viewer").toBe("translateY(0%)");
    layout().style.transform = "translateY(40%)";
    fireEvent.mouseLeave(layout());
    expect(layout().style.transform, "leaving with the mouse did not reset the viewer").toBe("translateY(0%)");
  });
});
