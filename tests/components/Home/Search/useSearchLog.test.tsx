import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({ logSearch: vi.fn() }));
vi.mock("services/search", () => ({ default: { logSearch: io.logSearch } }));

import { SEARCH_LOG_WAIT_MS, useSearchLog } from "components/Home/Search/useSearchLog";

const open = (value: string) =>
  renderHook(({ word, enabled }) => useSearchLog(word, enabled), {
    initialProps: { word: value, enabled: true },
  });

const wait = (ms: number) => act(async () => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  io.logSearch.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("useSearchLog", () => {
  it("logs a word once, only after it stayed for the whole wait", async () => {
    const { result } = open("shoes");

    act(() => result.current.scheduleLog("shoes", 4));
    await wait(SEARCH_LOG_WAIT_MS - 1);
    expect(io.logSearch, "the word was logged before the wait ended").not.toHaveBeenCalled();

    await wait(1);
    expect(io.logSearch, "the settled word was not logged with its count").toHaveBeenCalledWith("shoes", 4);
    expect(io.logSearch, "the word was logged more than once").toHaveBeenCalledOnce();
  });

  it("drops a half word when the shopper keeps typing", async () => {
    const view = open("sho");

    act(() => view.result.current.scheduleLog("sho", 9));
    await wait(300);
    view.rerender({ word: "shoe", enabled: true });
    await wait(SEARCH_LOG_WAIT_MS);

    expect(io.logSearch, "a half word reached the log").not.toHaveBeenCalled();
  });

  it("ignores a late answer for a word that is no longer in the box", async () => {
    const view = open("shoe");
    view.rerender({ word: "shoes", enabled: true });

    act(() => view.result.current.scheduleLog("shoe", 9));
    await wait(SEARCH_LOG_WAIT_MS);

    expect(io.logSearch, "the answer for an old word was logged").not.toHaveBeenCalled();
  });

  it("keeps only the newest result count for the same word", async () => {
    const { result } = open("shoes");

    act(() => result.current.scheduleLog("shoes", 9));
    await wait(300);
    act(() => result.current.scheduleLog("shoes", 2));
    await wait(SEARCH_LOG_WAIT_MS);

    expect(io.logSearch, "a filter change logged the word twice").toHaveBeenCalledOnce();
    expect(io.logSearch, "the newest count was not the one logged").toHaveBeenCalledWith("shoes", 2);
  });

  it("does not ask the server about a word too short to log", async () => {
    const { result } = open("ab");

    act(() => result.current.scheduleLog("ab", 1));
    await wait(SEARCH_LOG_WAIT_MS);

    expect(io.logSearch, "a two-letter word was sent to the server").not.toHaveBeenCalled();
  });

  it("logs a waiting word at once when the shopper leaves the page", async () => {
    const view = open("shoes");

    act(() => view.result.current.scheduleLog("shoes", 4));
    view.unmount();

    expect(io.logSearch, "tapping a product before the wait ended lost the word").toHaveBeenCalledWith("shoes", 4);
    await wait(SEARCH_LOG_WAIT_MS);
    expect(io.logSearch, "the word was logged again after leaving").toHaveBeenCalledOnce();
  });

  it("logs a waiting word at once when the search closes", async () => {
    const view = open("shoes");

    act(() => view.result.current.scheduleLog("shoes", 4));
    view.rerender({ word: "shoes", enabled: false });

    expect(io.logSearch, "closing the search lost the word").toHaveBeenCalledWith("shoes", 4);
  });

  it("logs nothing after cancelLog, because the listing page logs a submitted word", async () => {
    const view = open("shoes");

    act(() => view.result.current.scheduleLog("shoes", 4));
    act(() => view.result.current.cancelLog());
    view.unmount();
    await wait(SEARCH_LOG_WAIT_MS);

    expect(io.logSearch, "a submitted word was logged twice").not.toHaveBeenCalled();
  });
});
