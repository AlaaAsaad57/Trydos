import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...args: any[]) => fetchData(...args),
}));
const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => LogError(...a),
}));

// jsdom has no IntersectionObserver, so the sentinel is a stand-in and
// "scrolled to the end of the bar" is an explicit step.
let sentinelOnChange: ((inView: boolean) => void) | null = null;
vi.mock("react-intersection-observer", () => ({
  InView: ({ onChange }: any) => {
    sentinelOnChange = onChange;
    return <div data-testid="stories-sentinel" />;
  },
}));

import StoriesPaginationWrapper from "components/Home/Stories/StoriesPaginationWrapper";

const scrollToEnd = async () => {
  await act(async () => {
    sentinelOnChange?.(true);
  });
};

describe("StoriesPaginationWrapper", () => {
  beforeEach(() => {
    fetchData.mockReset();
    LogError.mockReset();
    sentinelOnChange = null;
  });

  it("draws nothing when there is no next page", async () => {
    const { container } = await renderWithProviders(
      <StoriesPaginationWrapper next_page_url="" userData={null} />,
    );
    expect(container.innerHTML, "a bar with no next page drew a sentinel").toBe("");
  });

  it("asks the stories service for the next page for a signed-in stories user, and keeps paging", async () => {
    fetchData.mockResolvedValue({
      success: true,
      data: { data: [{ id: 9, stories: [{ id: 90 }] }], next_page_url: "page-3" },
    });
    const { store } = await renderWithProviders(
      <StoriesPaginationWrapper next_page_url="page-2" userData={null} />,
      { store: { userStories: { id: 4, access_token: "x" }, storiesData: [{ id: 1 }] } },
    );
    await scrollToEnd();
    await waitFor(() =>
      expect(fetchData.mock.calls[0]?.[0].url, "the bar asked the stories service for the wrong page").toContain("page=2"),
    );
    await waitFor(() =>
      expect(
        (store.getState() as any).storiesData.map((s: any) => s.id),
        "the new page was not added after the stories already in the bar",
      ).toEqual([1, 9]),
    );
    expect(screen.getByTestId("stories-sentinel"), "the bar stopped paging while the service still had pages").toBeInTheDocument();
    await scrollToEnd();
    await waitFor(() =>
      expect(fetchData.mock.calls[1]?.[0].url, "the second scroll asked for the wrong page").toContain("page=3"),
    );
  });

  it("stops paging when the stories service says there is no next page", async () => {
    fetchData.mockResolvedValue({ success: true, data: { data: [], next_page_url: null } });
    await renderWithProviders(<StoriesPaginationWrapper next_page_url="page-2" userData={null} />);
    await scrollToEnd();
    await waitFor(() =>
      expect(screen.queryByTestId("stories-sentinel"), "the bar kept paging after the last page").toBeNull(),
    );
  });

  it("logs a refused page and stops asking", async () => {
    fetchData.mockResolvedValue({ success: false, message: "stories backend refused" });
    await renderWithProviders(<StoriesPaginationWrapper next_page_url="page-2" userData={null} />);
    await scrollToEnd();
    await waitFor(() =>
      expect(
        LogError.mock.calls[0]?.[0].error?.message,
        "a refused page from the stories backend was not logged with its message",
      ).toBe("stories backend refused"),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("stories-sentinel"), "the bar kept paging after the stories backend refused").toBeNull(),
    );
  });

  it("does not ask again while the sentinel is out of view", async () => {
    await renderWithProviders(<StoriesPaginationWrapper next_page_url="page-2" userData={null} />);
    await act(async () => {
      sentinelOnChange?.(false);
    });
    expect(fetchData, "the bar asked for a page while the end of the bar was not visible").not.toHaveBeenCalled();
  });
});
