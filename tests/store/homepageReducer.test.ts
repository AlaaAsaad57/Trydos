import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "store";

describe("Homepage store reducer actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      language: "en",
      country: "",
      countries: [],
      currency: null,
      activeRoute: null,
      loading: false,
    });
  });

  it("setAppLanguage updates application active language", () => {
    useAppStore.getState().setAppLanguage("ar");
    expect(useAppStore.getState().language, "language state should be updated to ar").toBe("ar");
  });

  it("setAppCountry updates application active country", () => {
    useAppStore.getState().setAppCountry("tr");
    expect(useAppStore.getState().country, "country state should be updated to tr").toBe("tr");
  });

  it("setCurrency sets active display currency", () => {
    const currency = { code: "USD", symbol: "$" };

    useAppStore.getState().setCurrency(currency);
    expect(useAppStore.getState().currency, "currency state should match").toEqual(currency);
  });

  it("setActiveRoute updates current active route string", () => {
    useAppStore.getState().setActiveRoute("/en/catalog");
    expect(useAppStore.getState().activeRoute, "activeRoute should be /en/catalog").toBe("/en/catalog");
  });

  it("setCountries populates country selection list", () => {
    const countries = [{ code: "US", name: "United States" }];
    useAppStore.getState().setCountries(countries);
    expect(useAppStore.getState().countries, "countries should be set").toEqual(countries);
  });
});

describe("Homepage store — flags and screens", () => {
  afterEach(() => {
    document.documentElement.style.overflow = "";
  });

  it.each([
    ["setAddStory", "addStoryEnable", true],
    ["setIsProductPage", "isProductPage", true],
    ["setOpenCamera", "OpenCamera", true],
    ["setStoriesRefreshing", "storiesRefreshing", true],
    ["setIsRegisteringReady", "isRegisteringReady", false],
    ["setSettings", "settings", { data: { a: 1 } }],
  ])("%s writes %s", (action, field, value) => {
    (useAppStore.getState() as any)[action](value);
    expect((useAppStore.getState() as any)[field], `${action} did not write ${field}`).toEqual(value);
  });

  it("setIsNavigating unlocks the page scroll when navigation ends", () => {
    document.documentElement.style.overflow = "hidden";
    useAppStore.getState().setIsNavigating(true);
    expect(document.documentElement.style.overflow, "the scroll was unlocked while navigating").toBe("hidden");
    useAppStore.getState().setIsNavigating(false);
    expect(document.documentElement.style.overflow, "the scroll stayed locked after navigating").toBe("initial");
    expect(useAppStore.getState().isNavigating, "the navigating flag is wrong").toBe(false);
  });

  it("setLoginOpen locks the page when the login opens and unlocks it at the top when it closes", () => {
    const scrollTo = vi.fn();
    document.documentElement.scrollTo = scrollTo as any;
    useAppStore.setState({ showMessage: true } as any);
    useAppStore.getState().setLoginOpen(true);
    expect(document.documentElement.style.overflow, "the page was not locked behind the login").toBe("hidden");
    expect(useAppStore.getState().showMessage, "the message stayed open with the login").toBe(false);
    useAppStore.getState().setLoginOpen(false);
    expect(scrollTo, "the page did not go back to the top").toHaveBeenCalledWith({ top: 0 });
    expect(document.documentElement.style.overflow, "the page stayed locked after the login closed").toBe("initial");
  });
});

describe("Homepage store — the stories bar and viewer", () => {
  const groups = () => [
    { id: 1, stories: [{ id: 11, is_seen: false }, { id: 12, is_seen: false }] },
    { id: 2, stories: [{ id: 21, is_seen: false }] },
    { id: 3, stories: [{ id: 31, is_seen: false }] },
  ];

  it("watchStory marks one item seen and leaves other groups alone", () => {
    useAppStore.setState({ storiesData: groups() } as any);
    useAppStore.getState().watchStory({ id: 1, pid: 12 });
    const data = useAppStore.getState().storiesData as any[];
    expect(data[0].stories.map((s: any) => s.is_seen), "the wrong item was marked seen").toEqual([false, true]);
    expect(data[1].stories[0].is_seen, "another group was changed").toBe(false);
  });

  it("the story actions do nothing while the feed is not loaded", () => {
    useAppStore.setState({ storiesData: null, selectedStory: "keep" } as any);
    useAppStore.getState().watchStory({ id: 1, pid: 1 });
    useAppStore.getState().nextStory(1);
    useAppStore.getState().prevStory(1);
    useAppStore.getState().removeStory(1, 1);
    expect(useAppStore.getState().storiesData, "an empty feed was changed").toBeNull();
    expect(useAppStore.getState().selectedStory, "the open story was changed").toBe("keep");
  });

  it("setSelectedStory opens a story and re-renders the viewer; setStoryData ends the loading", () => {
    useAppStore.setState({ renderStories: false, loadingStories: true } as any);
    useAppStore.getState().setSelectedStory({ id: 1 });
    expect(useAppStore.getState().selectedStory, "the story was not opened").toEqual({ id: 1 });
    expect(useAppStore.getState().renderStories, "the viewer was not re-rendered").toBe(true);
    useAppStore.getState().setStoryData(groups() as any);
    expect(useAppStore.getState().loadingStories, "the stories loading flag stayed on").toBe(false);
  });

  it("nextStory opens the next group, and closes the viewer after the last one", () => {
    useAppStore.setState({ storiesData: groups(), selectedStory: null } as any);
    useAppStore.getState().nextStory(1);
    expect(useAppStore.getState().selectedStory?.id, "the next group was not opened").toBe(2);
    useAppStore.getState().nextStory(3);
    expect(useAppStore.getState().selectedStory, "the viewer did not close after the last group").toBeNull();
  });

  it("prevStory opens the group before, and stays on the first one", () => {
    useAppStore.setState({ storiesData: groups(), selectedStory: { id: "open" } } as any);
    useAppStore.getState().prevStory(2);
    expect(useAppStore.getState().selectedStory?.id, "the previous group was not opened").toBe(1);
    useAppStore.getState().prevStory(1);
    expect(useAppStore.getState().selectedStory?.id, "the first group did not stay open").toBe(1);
  });

  it("removeStory drops one item, and the whole group when it was the last", () => {
    useAppStore.setState({
      storiesData: [...groups(), { id: 4 }],
    } as any);
    useAppStore.getState().removeStory("1", "11");
    useAppStore.getState().removeStory(2, 21);
    const data = useAppStore.getState().storiesData as any[];
    expect(data.map((g) => g.id), "an emptied group or a group with no list was kept").toEqual([1, 3]);
    expect(data[0].stories.map((s: any) => s.id), "the wrong item was removed").toEqual([12]);
  });
});

describe("Homepage store — the session id", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("falls back to a time-based id when crypto.randomUUID is missing or throws", async () => {
    vi.stubGlobal("crypto", undefined);
    vi.resetModules();
    // Load the store first, in the same order the app does: the reducer and
    // services/story import each other through the store.
    await import("store");
    const a = await import("store/homepage/reducer");
    const idA = a.useHomeStore(vi.fn(), vi.fn()).session_id;

    vi.stubGlobal("crypto", {
      randomUUID: () => {
        throw new Error("insecure context");
      },
    });
    vi.resetModules();
    await import("store");
    const b = await import("store/homepage/reducer");
    const idB = b.useHomeStore(vi.fn(), vi.fn()).session_id;

    expect([idA, idB].every((id) => /^s_\d+_\d+$/.test(id)), `the fallback ids are wrong: ${idA}, ${idB}`).toBe(true);
  });
});
