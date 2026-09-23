import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const actions = vi.hoisted(() => ({
  SelectStory: vi.fn(),
  setNextStory: vi.fn(),
  setPreviousStory: vi.fn(),
}));
vi.mock("store/homepage/actions", () => actions);

const storyService = vi.hoisted(() => ({ deleteStory: vi.fn(), WatchStory: vi.fn() }));
vi.mock("services/story", () => ({ default: storyService }));
vi.mock("services/auth", () => ({ default: { UserID: () => "u-1" } }));

const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));

const notify = vi.hoisted(() => ({ showSuccessNotification: vi.fn(), showErrorNotification: vi.fn() }));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  ...notify,
}));

let viewer: any = null;
const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  getUserStories: () => viewer,
  LogError: (...a: any[]) => LogError(...a),
}));

// The viewer itself is its own unit. This stand-in shows what the holder hands
// it and offers the four callbacks as buttons.
vi.mock("components/Home/Stories/StoryViewer", () => ({
  default: (p: any) => (
    <div data-testid="viewer" data-index={p.currentIndex} data-paused={String(!!p.isPaused)}>
      <button onClick={p.onPrevious}>prev</button>
      <button onClick={p.onNext}>next</button>
      <button onClick={p.onAllStoriesEnd}>all end</button>
      <button onClick={() => p.onStoryStart(p.currentIndex)}>start</button>
      <button onClick={() => p.onStoryStart(99)}>start missing</button>
      <button onClick={p.onStoryEnd}>end</button>
    </div>
  ),
}));
vi.mock("components/Home/Stories/ReportStoryModal", () => ({
  default: ({ storyId, onClose }: any) => (
    <div data-testid="report" data-story={storyId}>
      <button onClick={onClose}>close report</button>
    </div>
  ),
}));
vi.mock("components/global/ConfirmModal", () => ({
  ConfirmModal: ({ onCancel, onConfirm }: any) => (
    <div data-testid="confirm">
      <button onClick={onCancel}>cancel delete</button>
      <button onClick={onConfirm}>confirm delete</button>
    </div>
  ),
}));
vi.mock("components/global/TransParentLoader", () => ({ default: () => null }));

import StoryHolder from "components/Home/Stories/StoryHolder";

const group = (id: number, storyIds: number[], extra: any = {}) => ({
  id,
  stories: storyIds.map((s) => ({ id: s, ...extra })),
});

const index = () => screen.getByTestId("viewer").dataset.index;
const click = (name: string) => fireEvent.click(screen.getByText(name));

describe("StoryHolder", () => {
  beforeEach(() => {
    viewer = null;
    Object.values(actions).forEach((f) => f.mockReset());
    storyService.deleteStory.mockReset();
    storyService.WatchStory.mockReset();
    notify.showSuccessNotification.mockReset();
    notify.showErrorNotification.mockReset();
    GAevent.mockReset();
    LogError.mockReset();
  });

  it("steps through another author's stories and hands over to the next and previous author at the ends", async () => {
    await renderWithProviders(<StoryHolder story={group(2, [20, 21])} active isPaused={false} />);
    expect(index(), "another author's ring should open on its first story").toBe("0");
    click("prev");
    expect(actions.setPreviousStory, "going back from the first story did not open the previous author").toHaveBeenCalledWith(2);
    click("next");
    expect(index(), "next did not move to the second story").toBe("1");
    click("next");
    expect(actions.setNextStory, "going past the last story did not open the next author").toHaveBeenCalledWith(2);
    click("prev");
    expect(index(), "prev did not move back to the first story").toBe("0");
    click("next");
    click("all end");
    expect(index(), "the end of the ring did not reset to the first story").toBe("0");
    expect(actions.setNextStory, "the end of the ring did not open the next author").toHaveBeenCalledTimes(2);
    click("end");
  });

  it("opens the shopper's own ring on the newest story", async () => {
    await renderWithProviders(<StoryHolder story={group(5, [50, 51, 52])} active isPaused={false} />, {
      store: { userStories: { id: 5 } },
    });
    expect(index(), "the shopper's own ring should open on the newest story").toBe("2");
  });

  it("ignores every control on a pane that is not in front", async () => {
    const { container } = await renderWithProviders(<StoryHolder story={group(2, [20, 21])} active={false} isPaused />);
    click("prev");
    click("next");
    click("all end");
    click("start");
    expect(actions.setPreviousStory, "a hidden pane moved to the previous author").not.toHaveBeenCalled();
    expect(actions.setNextStory, "a hidden pane moved to the next author").not.toHaveBeenCalled();
    expect(storyService.WatchStory, "a hidden pane marked a story as watched").not.toHaveBeenCalled();
    expect(index(), "a hidden pane moved its own story").toBe("0");
    expect(screen.getByTestId("viewer").dataset.paused, "a hidden pane is not paused").toBe("true");
    expect(container.firstElementChild!.hasAttribute("data-story-id"), "a hidden pane names a story").toBe(false);
  });

  it("marks a story watched and reports the view, naming the product screen on a product page", async () => {
    const story = { id: 3, stories: [{ id: 30, product_id: 8, full_video_path: "v.mp4", link: "l" }] };
    await renderWithProviders(<StoryHolder story={story} active isPaused={false} />, { path: "/products/x" });
    click("start");
    expect(storyService.WatchStory, "the story was not marked watched").toHaveBeenCalledWith(30, 3);
    const params = GAevent.mock.calls[0][0].params;
    expect(params.story_type, "a video story was reported as a picture").toBe("video");
    expect(params.screen_name, "a view on a product page named the wrong screen").toContain("product");
    click("start missing");
    expect(storyService.WatchStory, "a story index that does not exist was marked watched").toHaveBeenCalledTimes(1);
  });

  it("reports a picture view on the home screen, and skips a story with no id", async () => {
    await renderWithProviders(<StoryHolder story={{ id: 3, stories: [{ id: 31 }] }} active isPaused={false} />);
    click("start");
    const params = GAevent.mock.calls[0][0].params;
    expect(params.story_type, "a picture story was reported as a video").toBe("image");
    expect(params.product_link, "a story with no product claimed a product link").toBe(false);
    GAevent.mockReset();
    const second = await renderWithProviders(<StoryHolder story={{ id: 4, stories: [{}] }} active isPaused={false} />);
    fireEvent.click(second.getAllByText("start").at(-1)!);
    expect(GAevent, "a story with no id was reported").not.toHaveBeenCalled();
  });

  it("closes the viewer from the X by tap and by keyboard", async () => {
    await renderWithProviders(<StoryHolder story={group(2, [20])} active isPaused={false} />);
    const close = screen.getByLabelText("Close story viewer");
    fireEvent.click(close);
    fireEvent.keyDown(close, { key: "Enter" });
    fireEvent.keyDown(close, { key: " " });
    fireEvent.keyDown(close, { key: "a" });
    expect(actions.SelectStory.mock.calls, "the X should close on tap, Enter and Space only").toEqual([[null], [null], [null]]);
  });

  it("lets a stories user report another author's current story, and pauses meanwhile", async () => {
    await renderWithProviders(<StoryHolder story={group(2, [20, 21])} active isPaused={false} />, {
      store: { userStories: { id: 9 } },
    });
    expect(screen.queryByLabelText("Delete story"), "a stranger's story offered Delete").toBeNull();
    const report = screen.getByLabelText("Report story");
    fireEvent.keyDown(report, { key: "a" });
    expect(screen.queryByTestId("report"), "a letter key opened the report").toBeNull();
    fireEvent.keyDown(report, { key: "Enter" });
    expect(screen.getByTestId("report").dataset.story, "the report is about the wrong story").toBe("20");
    expect(screen.getByTestId("viewer").dataset.paused, "the story kept playing under the report").toBe("true");
    click("close report");
    fireEvent.keyDown(report, { key: " " });
    click("close report");
    fireEvent.click(report);
    expect(screen.getByTestId("report"), "a tap did not open the report").toBeInTheDocument();
  });

  it("falls back to the first story's id when the current one is missing", async () => {
    await renderWithProviders(<StoryHolder story={{ id: 2, stories: [{ id: 20 }, {}] }} active isPaused={false} />, {
      store: { userStories: { id: 9 } },
    });
    click("next");
    fireEvent.click(screen.getByLabelText("Report story"));
    expect(screen.getByTestId("report").dataset.story, "the report did not fall back to the first story").toBe("20");
  });

  it("deletes the owner's only story, moves on to the next author and says so", async () => {
    viewer = { id: 5 };
    const removeStory = vi.fn();
    storyService.deleteStory.mockResolvedValue(undefined);
    await renderWithProviders(<StoryHolder story={group(5, [50])} active isPaused={false} />, {
      store: { userStories: { id: 5 }, removeStory },
    });
    const del = screen.getByLabelText("Delete story");
    fireEvent.keyDown(del, { key: "x" });
    expect(screen.queryByTestId("confirm"), "a letter key opened the delete prompt").toBeNull();
    fireEvent.keyDown(del, { key: "Enter" });
    click("cancel delete");
    expect(screen.queryByTestId("confirm"), "Cancel did not close the delete prompt").toBeNull();
    fireEvent.keyDown(del, { key: " " });
    click("cancel delete");
    fireEvent.click(del);
    await act(async () => click("confirm delete"));
    expect(storyService.deleteStory, "the wrong story was sent to the stories backend").toHaveBeenCalledWith(50);
    expect(actions.setNextStory, "deleting the only story did not move to the next author").toHaveBeenCalledWith(5);
    expect(removeStory, "the story stayed in the bar after deleting").toHaveBeenCalledWith(5, 50);
    expect(notify.showSuccessNotification, "the shopper was not told the story was deleted").toHaveBeenCalledWith("Story deleted successfully.");
    expect(screen.queryByTestId("confirm"), "the delete prompt stayed open").toBeNull();
  });

  it("stays on a valid story after deleting the last of several", async () => {
    viewer = { id: 5 };
    const removeStory = vi.fn();
    storyService.deleteStory.mockResolvedValue(undefined);
    await renderWithProviders(<StoryHolder story={group(5, [50, 51, 52])} active isPaused={false} />, {
      store: { userStories: { id: 5 }, removeStory },
    });
    fireEvent.click(screen.getByLabelText("Delete story"));
    await act(async () => click("confirm delete"));
    expect(storyService.deleteStory, "the newest story was not the one deleted").toHaveBeenCalledWith(52);
    expect(index(), "the viewer did not step back to the story before the deleted one").toBe("1");
    expect(actions.setNextStory, "deleting one of several stories left the author").not.toHaveBeenCalled();
  });

  it("keeps the story and shows the stories backend's error when the delete is refused", async () => {
    viewer = { id: 5 };
    const removeStory = vi.fn();
    storyService.deleteStory.mockRejectedValue(new Error("not yours"));
    await renderWithProviders(<StoryHolder story={group(5, [50])} active isPaused={false} />, {
      store: { userStories: { id: 5 }, removeStory },
    });
    fireEvent.click(screen.getByLabelText("Delete story"));
    await act(async () => click("confirm delete"));
    expect(notify.showErrorNotification, "the stories backend's refusal was not shown").toHaveBeenCalledWith("not yours");
    expect(removeStory, "a refused delete still removed the story").not.toHaveBeenCalled();
    expect(LogError, "a refused delete was not logged").toHaveBeenCalled();
  });

  it("shows a general message when a refused delete carries no text", async () => {
    viewer = { id: 5 };
    storyService.deleteStory.mockRejectedValue(null);
    await renderWithProviders(<StoryHolder story={group(5, [50])} active isPaused={false} />, {
      store: { userStories: { id: 5 } },
    });
    fireEvent.click(screen.getByLabelText("Delete story"));
    await act(async () => click("confirm delete"));
    expect(notify.showErrorNotification, "no fallback for an empty refusal").toHaveBeenCalledWith("Failed to delete story.");
  });
});
