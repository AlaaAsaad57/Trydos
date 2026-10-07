import React, { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DemoKeyboard from "components/DemoApp1/keyboard/DemoKeyboard";
import {
  DebugButtons,
  resetDemoDebug,
} from "components/DemoApp/demoDebug";
import { resetDevice, setDevice } from "../../../mocks/device";

/** Three fields like the demo's: a name, an amount with its filter, an email. */
function Page({ locale = "sy-en" }: { locale?: string }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  return (
    <>
      <input
        data-pw="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        data-pw="amount"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
      />
      <input
        data-pw="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        data-pw="query"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <input data-pw="tick" type="checkbox" />
      <DemoKeyboard locale={locale} t={(key) => key} />
    </>
  );
}

const input = (name: string) => {
  const el = document.querySelector<HTMLInputElement>(`[data-pw="${name}"]`);
  expect(el, `the test page has no "${name}" field`).not.toBeNull();
  return el!;
};

const keyboard = () =>
  document.body.querySelector<HTMLElement>('[data-pw="demo-keyboard"]');

const focus = (name: string) => act(() => input(name).focus());

/** Presses and lets go of one key, by its data-pw. */
const tap = (key: string) => {
  const el = document.body.querySelector(`[data-pw="${key}"]`);
  expect(el, `the keyboard has no "${key}" key on this page`).not.toBeNull();
  fireEvent.pointerDown(el!);
  fireEvent.pointerUp(el!);
};

describe("DemoKeyboard — the page's own keyboard on a touch device", () => {
  beforeEach(() => setDevice("touch"));
  afterEach(() => {
    // The fields are looked up on the document, so the last test's page must go.
    cleanup();
    vi.restoreAllMocks();
    resetDevice();
  });

  it("keeps the device's keyboard off every text field, and remembers what each one asked for", () => {
    render(<Page />);
    expect(
      input("name").getAttribute("inputmode"),
      'the name field is not inputmode="none", so the phone opens its own keyboard',
    ).toBe("none");
    expect(
      input("amount").getAttribute("inputmode"),
      'the amount field is not inputmode="none", so the phone opens its number pad',
    ).toBe("none");
    expect(
      input("amount").getAttribute("data-kb"),
      "the amount field lost the decimal pad it asked for",
    ).toBe("decimal");
    expect(
      input("email").getAttribute("data-kb"),
      "the email field is not marked as an email",
    ).toBe("email");
    expect(
      input("tick").getAttribute("inputmode"),
      "a checkbox was marked as a text field",
    ).toBeNull();
  });

  it("gives the fields back to the device's keyboard when the window turns out to be a desktop", () => {
    render(<Page />);
    setDevice("pointer");
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(
      input("amount").getAttribute("inputmode"),
      "the amount field did not get its decimal inputmode back",
    ).toBe("decimal");
    expect(
      input("name").hasAttribute("inputmode"),
      "the name field kept inputmode=none after the keyboard left",
    ).toBe(false);
  });

  it("is away until a field takes the focus, and goes away again when the field lets go", async () => {
    render(<Page />);
    expect(keyboard(), "the keyboard is up with no field in use").toBeNull();
    focus("name");
    expect(keyboard(), "the keyboard did not come up on focus").not.toBeNull();
    act(() => input("name").blur());
    await waitFor(() =>
      expect(keyboard(), "the keyboard stayed up after the blur").toBeNull(),
    );
  });

  // Seen on the iPhone: Safari draws a fixed box only down to the window's
  // end, 16 pt above its bar, so a fixed keyboard stopped above the bar. Only
  // what is in the document is drawn under the bar, like a sheet's tail.
  it("is in the document at the window's end, not fixed, so Safari draws it under its bar", () => {
    Object.defineProperty(window, "scrollY", { value: 300, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    try {
      render(<Page />);
      focus("name");
      const anchor = keyboard()!.parentElement!;
      expect(
        anchor.style.position,
        "the keyboard's anchor is fixed; Safari cuts a fixed box at the window's end, above its bar",
      ).toBe("absolute");
      expect(
        anchor.style.top,
        "the anchor is not at the window's end (the page's scroll, 300, and the window's height, 800)",
      ).toBe("1100px");
      expect(
        anchor.style.width,
        "the keyboard's anchor has a width of its own",
      ).toBe("0px");
      Object.defineProperty(window, "scrollY", { value: 450, configurable: true });
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
      expect(
        anchor.style.top,
        "the keyboard did not stay at the window's end when the page scrolled to 450",
      ).toBe("1250px");
    } finally {
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
      Object.defineProperty(window, "innerHeight", { value: 768, configurable: true });
    }
  });

  it("runs on 120 px past the window's end, so its glass starts behind Safari's bar and the keys stay over the bar", () => {
    render(<Page />);
    focus("name");
    expect(
      keyboard()!.style.bottom,
      "the keyboard's glass stops at the window's end, above Safari's bar",
    ).toBe("-120px");
    expect(
      keyboard()!.style.paddingBottom,
      "the keys have no room under them, so the last row would be under Safari's bar",
    ).toBe("120px");
  });

  // Measured on pictures from the iPhone: Safari's bar starts 34 pt from each
  // side of the screen. Its glass is white at about 48 %, and it lies on the
  // keyboard's own glass; the panel at 53 % then shows the bar's colour.
  it("is as wide as the page column, and the keys stay as wide as Safari's bar: 34 px of padding more on each side", () => {
    render(<Page />);
    focus("name");
    expect(
      keyboard()!.style.marginLeft,
      "the keyboard's glass starts 34 px in from the column's left side, not at the side",
    ).toBe("");
    expect(
      keyboard()!.style.paddingLeft,
      "the keys do not start 37 px in from the left (34 for the bar, 3 of the panel's own)",
    ).toBe("37px");
    expect(
      keyboard()!.style.paddingRight,
      "the keys do not end 37 px before the right (34 for the bar, 3 of the panel's own)",
    ).toBe("37px");
  });

  it("has the colour of Safari's bar: white at 53 %, and round on all four corners", () => {
    render(<Page />);
    focus("name");
    const css = keyboard()!.querySelector("style")?.textContent ?? "";
    expect(
      css,
      "the panel's tint is not the white at 53 % that gives the colour of Safari's bar",
    ).toContain("--dkb-panel: rgba(255, 255, 255, 0.53);");
    expect(
      css,
      "the panel's top corners are not the wallet sheets' radius (50)",
    ).toContain("border-radius: 50px 50px 26px 26px;");
  });

  describe("when the keys would cover the field in use", () => {
    // jsdom lays nothing out: here every box ends far under the keys.
    const scrollBy = vi.fn();
    const scrollByBefore = Element.prototype.scrollBy;
    beforeEach(() => {
      vi.useFakeTimers();
      scrollBy.mockClear();
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
        () => ({ height: 23, bottom: 5000 }) as DOMRect,
      );
      vi.spyOn(window, "scrollBy").mockImplementation(scrollBy);
      Element.prototype.scrollBy = scrollBy;
    });
    afterEach(() => {
      vi.useRealTimers();
      Element.prototype.scrollBy = scrollByBefore;
    });

    it("scrolls nothing and adds no room to the page: the keyboard moves nothing", () => {
      render(<Page />);
      focus("name");
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(
        scrollBy.mock.calls,
        "the keyboard scrolled the page to bring the field over the keys",
      ).toEqual([]);
      expect(
        document.body.querySelector('[data-pw="demo-keyboard-room"]'),
        "the keyboard added room to the page so it could scroll the field up",
      ).toBeNull();
    });

    it("leaves a sheet that cannot scroll where it is", () => {
      render(
        <div data-demo-layer="" data-pw="layer">
          <Page />
        </div>,
      );
      focus("name");
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(
        document.querySelector<HTMLElement>('[data-pw="layer"]')!.style.transform,
        "the keyboard moved the sheet up to bring the field over the keys",
      ).toBe("");
    });
  });

  it("types a capital first and small letters after it", () => {
    render(<Page />);
    focus("name");
    tap("kb-key-h");
    tap("kb-key-i");
    expect(
      input("name").value,
      "the first letter was not a capital, or the second one was",
    ).toBe("Hi");
  });

  it("shift types one capital; a double tap locks the capitals", () => {
    render(<Page />);
    focus("name");
    tap("kb-key-a");
    tap("kb-shift");
    tap("kb-key-b");
    tap("kb-key-c");
    expect(input("name").value, "shift did not type one capital only").toBe(
      "ABc",
    );
    tap("kb-shift");
    tap("kb-shift");
    expect(
      document.body
        .querySelector('[data-pw="kb-shift"]')
        ?.getAttribute("data-shift"),
      "a double tap on shift did not lock the capitals",
    ).toBe("lock");
    tap("kb-key-d");
    tap("kb-key-e");
    expect(input("name").value, "caps lock did not keep the capitals").toBe(
      "ABcDE",
    );
  });

  it("the 123 key shows the numbers, #+= the symbols, and ABC the letters again", () => {
    render(<Page />);
    focus("name");
    tap("kb-numbers");
    expect(keyboard()!.getAttribute("data-page"), "123 did not open the numbers").toBe(
      "numbers",
    );
    tap("kb-key-7");
    tap("kb-symbols");
    expect(keyboard()!.getAttribute("data-page"), "#+= did not open the symbols").toBe(
      "symbols",
    );
    tap("kb-key-€");
    tap("kb-letters");
    expect(keyboard()!.getAttribute("data-page"), "ABC did not bring the letters back").toBe(
      "letters",
    );
    expect(input("name").value, "the number or the symbol was not typed").toBe(
      "7€",
    );
  });

  it("space types a space, and the delete key takes the last character", () => {
    render(<Page />);
    focus("name");
    tap("kb-key-a");
    tap("kb-space");
    tap("kb-key-b");
    expect(input("name").value, "space did not type a space").toBe("A b");
    tap("kb-back");
    expect(input("name").value, "delete did not take the last character").toBe(
      "A ",
    );
  });

  it("a held delete key goes on deleting, and stops when the finger lifts", () => {
    vi.useFakeTimers();
    try {
      render(<Page />);
      focus("name");
      for (const key of ["a", "b", "c", "d", "e", "f"]) tap(`kb-key-${key}`);
      const back = document.body.querySelector('[data-pw="kb-back"]')!;
      fireEvent.pointerDown(back);
      expect(input("name").value, "the press itself did not delete one").toBe(
        "Abcde",
      );
      act(() => {
        vi.advanceTimersByTime(400 + 80 * 2);
      });
      expect(
        input("name").value,
        "holding delete for 560 ms did not delete two more",
      ).toBe("Abc");
      fireEvent.pointerUp(back);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(
        input("name").value,
        "delete went on after the finger lifted",
      ).toBe("Abc");
    } finally {
      vi.useRealTimers();
    }
  });

  it("the globe key changes the letters to Arabic and back", () => {
    render(<Page />);
    focus("name");
    expect(keyboard()!.getAttribute("data-language"), "an English page did not start with English letters").toBe(
      "en",
    );
    tap("kb-globe");
    expect(keyboard()!.getAttribute("data-language"), "the globe key did not change to Arabic").toBe(
      "ar",
    );
    tap("kb-key-ض");
    expect(input("name").value, "the Arabic letter was not typed").toBe("ض");
    tap("kb-globe");
    expect(keyboard()!.getAttribute("data-language"), "the globe key did not go back to English").toBe(
      "en",
    );
  });

  it("starts with Arabic letters on an Arabic page, but with Latin letters and @ for an email", () => {
    render(<Page locale="sy-ar" />);
    focus("name");
    expect(keyboard()!.getAttribute("data-language"), "an Arabic page did not start with Arabic letters").toBe(
      "ar",
    );
    focus("email");
    expect(keyboard()!.getAttribute("data-language"), "the email field got Arabic letters").toBe(
      "en",
    );
    tap("kb-key-a");
    tap("kb-key-@");
    expect(input("email").value, "the email keys did not type").toBe("a@");
  });

  it("shows the number pad for an amount, and the field's own filter still decides", () => {
    render(<Page />);
    focus("amount");
    expect(keyboard()!.getAttribute("data-page"), "the amount field did not get the number pad").toBe(
      "pad",
    );
    expect(
      document.body.querySelector('[data-pw="kb-key-q"]'),
      "the number pad shows letter keys",
    ).toBeNull();
    tap("kb-key-1");
    tap("kb-key-.");
    tap("kb-key-5");
    tap("kb-back");
    expect(input("amount").value, "the number pad did not type the amount").toBe(
      "1.",
    );
  });

  it("the return key sends Enter to the field and puts the keyboard away", async () => {
    render(<Page />);
    focus("query");
    const onKey = vi.fn();
    input("query").addEventListener("keydown", (e) => onKey(e.key));
    expect(
      document.body.querySelector('[data-pw="kb-return"]')?.className,
      "the search field's return key is not the blue action key",
    ).toContain("dkb-go");
    tap("kb-return");
    expect(onKey, "the field did not get an Enter keydown").toHaveBeenCalledWith(
      "Enter",
    );
    await waitFor(() =>
      expect(keyboard(), "return did not put the keyboard away").toBeNull(),
    );
  });

  it("a press on a key does not take the focus off the field", () => {
    render(<Page />);
    focus("name");
    const key = document.body.querySelector('[data-pw="kb-key-q"]')!;
    expect(
      fireEvent.mouseDown(key),
      "the mouse-down on a key was not stopped, so the field would lose the focus",
    ).toBe(false);
    expect(
      fireEvent.touchStart(key),
      "the touch on a key was not stopped, so the field would lose the focus",
    ).toBe(false);
  });

  describe("a tap on the page", () => {
    // jsdom lays nothing out. Here a field is 23 px tall and every other box
    // is as tall as a screen, which is what the keyboard measures.
    beforeEach(() => {
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
        function (this: Element) {
          return { height: this.tagName === "INPUT" ? 23 : 800 } as DOMRect;
        },
      );
    });

    it("outside the field puts the keyboard away", async () => {
      render(<Page />);
      focus("name");
      fireEvent.click(document.body);
      await waitFor(() =>
        expect(
          keyboard(),
          "a tap outside did not put the keyboard away",
        ).toBeNull(),
      );
    });

    it("on the field in use keeps the keyboard up", async () => {
      render(<Page />);
      focus("name");
      fireEvent.click(input("name"));
      await new Promise((done) => setTimeout(done, 50));
      expect(
        keyboard(),
        "a tap on the field in use put the keyboard away",
      ).not.toBeNull();
    });
  });
});

describe("DemoKeyboard — the debug switch for its theme", () => {
  beforeEach(() => setDevice("touch"));
  afterEach(() => {
    cleanup();
    resetDemoDebug();
    resetDevice();
  });

  /** The page with the demo's debug buttons in their box, as in the shell. */
  const WithSwitch = () => (
    <>
      <div data-pw="demo-controls">
        <DebugButtons t={(key) => key} />
      </div>
      <Page />
    </>
  );

  const theme = () => keyboard()?.getAttribute("data-theme");
  const flip = () => {
    const button = document.querySelector(
      '[data-pw="demo-debug-keyboard-theme"]',
    );
    expect(
      button,
      "the debug buttons have no keyboard theme switch",
    ).not.toBeNull();
    fireEvent.click(button!);
  };

  it("starts on the app theme", () => {
    render(<WithSwitch />);
    focus("name");
    expect(theme(), "the keyboard did not start on the app theme").toBe("app");
  });

  it("a tap gives the dark keyboard, and the next tap the app theme again, with the keyboard still up", async () => {
    render(<WithSwitch />);
    focus("name");
    flip();
    expect(theme(), "the switch did not turn the keyboard dark").toBe("dark");
    await new Promise((done) => setTimeout(done, 50));
    expect(
      keyboard(),
      "a tap on the switch put the keyboard away, so the tester cannot compare the two themes",
    ).not.toBeNull();
    flip();
    expect(theme(), "a second tap did not give the app theme back").toBe("app");
  });

  it("the dark colours are in the style for both the switch and a dark phone", () => {
    render(<WithSwitch />);
    focus("name");
    const css = keyboard()!.querySelector("style")!.textContent ?? "";
    expect(
      css,
      'the style has no rule for the switch (.dkb[data-theme="dark"])',
    ).toContain('.dkb[data-theme="dark"]');
    expect(
      css,
      "the style no longer follows the phone's dark theme",
    ).toContain("@media (prefers-color-scheme: dark)");
  });
});

describe("DemoKeyboard — with a mouse and a real keyboard", () => {
  beforeEach(() => setDevice("pointer"));
  afterEach(() => {
    cleanup();
    resetDevice();
  });

  it("is never shown and leaves the fields as they are", () => {
    render(<Page />);
    focus("name");
    expect(keyboard(), "the page's keyboard came up on a desktop").toBeNull();
    expect(
      input("amount").getAttribute("inputmode"),
      "the amount field lost its decimal inputmode on a desktop",
    ).toBe("decimal");
  });
});
