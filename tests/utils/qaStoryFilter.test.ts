import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { dropQaStories, isQaStoryViewer } from "utils/qaStoryFilter";

// The viewer allow-list: the one way a QA story is shown rather than hidden.
//
// Two directions, and they are not equally dangerous. Failing to show a QA story
// to a test account wastes a test run. Showing one to everybody puts test
// content on a real customer's screen, which is what the whole QA safety lock
// exists to stop — so the "matches nobody" cases below are the important half of
// this file, not the padding.

const QA_HOST = "qa-test.trydos.tech";
const TESTER_PHONE = "999000000001";
const STRANGER_PHONE = "999000000002";

/** One author with three stories: a QA one between two real ones. */
const mixedGroup = () => ({
  id: 500,
  name: "A real person",
  stories: [
    { id: 1, link: "https://trydos.com/product/real-one" },
    { id: 2, link: `https://${QA_HOST}/e2e/abc123/photo` },
    { id: 3, link: "" },
  ],
});

const shownIds = (groups: any[]) =>
  (groups?.[0]?.stories ?? []).map((story: any) => story.id);

describe("who the viewer allow-list lets through", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps a QA story when the viewer is on the list", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", TESTER_PHONE);

    expect(
      shownIds(dropQaStories([mixedGroup()], TESTER_PHONE)),
      "a viewer whose phone is in NEXT_PUBLIC_QA_STORY_VIEWER_PHONES was not shown the QA story, so a test account cannot open, report or delete the story its own run uploaded",
    ).toEqual([1, 2, 3]);
  });

  it("drops a QA story for a viewer who is not on a configured list", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", TESTER_PHONE);

    expect(
      shownIds(dropQaStories([mixedGroup()], STRANGER_PHONE)),
      "configuring the list for one account opened the QA story to a different account, so every signed-in customer on such a build would see test content",
    ).toEqual([1, 3]);
  });

  it("drops a QA story when no list is configured at all", () => {
    expect(
      shownIds(dropQaStories([mixedGroup()], TESTER_PHONE)),
      "a QA story was shown with NEXT_PUBLIC_QA_STORY_VIEWER_PHONES unset. Unset is the state of every deployed build, so this is test content reaching real customers",
    ).toEqual([1, 3]);
  });

  it("drops a QA story when the caller names no viewer", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", TESTER_PHONE);

    expect(
      shownIds(dropQaStories([mixedGroup()])),
      "a reader that does not know who is looking was shown the QA story. That is the state of every guest, and of every signed-in visitor before the store is filled",
    ).toEqual([1, 3]);
  });
});

describe("a viewer with no real phone is never on the list", () => {
  // The dangerous direction. Each of these is what a reader passes when it does
  // not yet know who is looking; a list entry that matched one would open QA
  // stories to everybody on a build where the list is set.
  const notAPhone: [string, unknown][] = [
    ["an empty string", ""],
    ["a blank string", "   "],
    ["null", null],
    ["undefined", undefined],
    ["the number zero", 0],
    ["the string zero — the app's own no-phone marker", "0"],
    ["not a number", Number.NaN],
    ["punctuation only", "+- ()"],
  ];

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(notAPhone)("refuses %s as a viewer phone", (_name, viewerPhone) => {
    // The list holds every shape that might be mistaken for "no id", so the only
    // thing that can make this pass is the viewer side refusing them.
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", '0,00,NaN,null,undefined,""');

    expect(
      isQaStoryViewer(viewerPhone),
      "a value that means 'nobody is signed in yet' was treated as a listed test account, which would show QA stories to every viewer on a build where the list is set",
    ).toBe(false);
  });

  it("drops the empty entries a trailing comma leaves behind", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", `${TESTER_PHONE},,`);

    expect(
      isQaStoryViewer(""),
      "a trailing comma left an empty entry in the list, and an empty entry matches every viewer that has no phone",
    ).toBe(false);

    expect(
      isQaStoryViewer(TESTER_PHONE),
      "dropping the empty entries also dropped the real one, so no test account would be recognised",
    ).toBe(true);
  });
});

describe("a malformed list changes nothing and never throws", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  const malformed: [string, string][] = [
    ["an empty value", ""],
    ["only spaces", "   "],
    ["only commas", ",,,"],
    ["spaces around the numbers", `  ${TESTER_PHONE} , ${STRANGER_PHONE}  `],
  ];

  it.each(malformed)("survives %s", (name, value) => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", value);

    expect(
      () => dropQaStories([mixedGroup()], TESTER_PHONE),
      `a list made of ${name} threw instead of being ignored. A throw inside a story reader leaves the home stories bar stuck on its skeleton`,
    ).not.toThrow();
  });

  it("still recognises a number that was written with spaces around it", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", `  ${TESTER_PHONE} , ${STRANGER_PHONE} `);

    expect(
      isQaStoryViewer(TESTER_PHONE),
      "a number written with spaces around it in the list was not recognised, so the setting would look correct and do nothing",
    ).toBe(true);
  });

  it("matches a number against a list written as text", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", TESTER_PHONE);

    expect(
      isQaStoryViewer(Number(TESTER_PHONE)),
      "the store holds the phone as a number while the list is text, and the two did not match",
    ).toBe(true);
  });

  it("never matches a number that merely starts with a listed one", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", TESTER_PHONE);

    expect(
      isQaStoryViewer(`${TESTER_PHONE}9`),
      "a phone was matched by containment rather than by being equal, so a longer number starting with a listed one would be treated as a test account",
    ).toBe(false);
  });
});

describe("the allow-list is not set anywhere in the repository", () => {
  // AC-18. The whole guarantee for this feature is that the list is empty on
  // every build a customer can reach, and the cheapest way that breaks is
  // somebody committing a value into a tracked environment file.
  //
  // **A mention is not a setting.** `.env.example` documents this variable with
  // nothing after the `=`, which is exactly what a template should do — so what
  // is looked for is an assignment carrying a **value**, never the name alone.
  //
  // **Residual, stated:** this cannot see a value set in a hosting platform's
  // own settings. It narrows the risk; it does not close it.
  const VARIABLE = "NEXT_PUBLIC_QA_STORY_VIEWER_PHONES";

  const ASSIGNMENT = new RegExp(`^(?:export\\s+)?${VARIABLE}\\s*=(.*)$`);

  /** The value an env file gives the variable, or `""` when it only names it.
   *  Ignores a trailing `# comment` and surrounding quotes. */
  const valueAssignedIn = (contents: string): string => {
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) continue;

      const match = trimmed.match(ASSIGNMENT);
      if (!match) continue;

      const value = match[1]
        .replace(/\s+#.*$/, "")
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim();
      if (value) return value;
    }
    return "";
  };

  const trackedEnvFiles = (): string[] =>
    readdirSync(process.cwd()).filter(
      (name) => name === ".env" || name.startsWith(".env."),
    );

  it("is given a value by no tracked env file", () => {
    const root = process.cwd();

    const offenders = trackedEnvFiles().filter((name) =>
      Boolean(valueAssignedIn(readFileSync(resolve(root, name), "utf8"))),
    );

    expect(
      offenders,
      `a tracked environment file gives ${VARIABLE} a value. Any build made from it shows QA stories to the accounts named there, and the numbers ship inside the browser bundle of a public repository`,
    ).toEqual([]);
  });

  it("can tell a documented name from a real value", () => {
    // Without this the check above would also pass for a reader that matches
    // nothing at all — a renamed variable, a broken regular expression — and
    // the guard would be quietly dead.
    expect(
      valueAssignedIn(`# a template\n${VARIABLE}=   # left empty on purpose\n`),
      "a documented name with nothing after the = was read as a configured value, so a correct template would fail this guard",
    ).toBe("");

    expect(
      valueAssignedIn(`${VARIABLE}=963111111111,963222222222\n`),
      "a real value in an env file was not detected, so the guard cannot do its job",
    ).toBe("963111111111,963222222222");

    expect(
      valueAssignedIn(`${VARIABLE}="963111111111"  # quoted\n`),
      "a quoted value was not detected",
    ).toBe("963111111111");
  });

  it("has an env file to read, so it cannot pass vacuously", () => {
    expect(
      trackedEnvFiles(),
      "no env file was found to check at all, so this guard is passing without looking at anything",
    ).toContain(".env.example");
  });
});

describe("a number is matched however it is written", () => {
  // The same rule `utils/server/otpAllowlist.ts` uses for the test numbers that
  // skip the one-time-code limiter: everything that is not a digit is noise, on
  // both sides. The app, the environment file and a person typing all write a
  // phone number differently, and a list that only matched one of those shapes
  // would look correct and quietly do nothing.
  const shapes = [
    "+999000000001",
    "999 000 000 001",
    "+999 (000) 000-001",
    "999-000-000-001",
  ];

  it.each(shapes)("matches %s against a plain list entry", (written) => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", "999000000001");

    expect(
      isQaStoryViewer(written),
      "the same phone number written in a different shape was not recognised, so the test account would silently not be a test account",
    ).toBe(true);
  });

  it("matches a list entry that itself carries punctuation", () => {
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES", "+999 000 000 001");

    expect(
      isQaStoryViewer("999000000001"),
      "the list was written with spaces and a plus, and the plain number the app holds did not match it",
    ).toBe(true);
  });
});

describe("the QA host itself", () => {
  it("uses a valid override host, and falls back for one that will not parse", async () => {
    const { isQaStory } = await import("utils/qaStoryFilter");
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_LINK_HOST", "https://QA.example.com/");
    expect(isQaStory({ link: "https://qa.example.com/p" }), "the override host was not used").toBe(true);
    vi.stubEnv("NEXT_PUBLIC_QA_STORY_LINK_HOST", "http://exa mple");
    expect(isQaStory({ link: "https://qa-test.trydos.tech/p" }), "an unparseable override did not fall back").toBe(true);
    vi.unstubAllEnvs();
  });

  it("does not treat a missing story or a link that is not text as QA", async () => {
    const { isQaStory } = await import("utils/qaStoryFilter");
    expect([isQaStory(null), isQaStory("x"), isQaStory({ link: 5 })], "a non-story was treated as QA").toEqual([
      false,
      false,
      false,
    ]);
  });
});
