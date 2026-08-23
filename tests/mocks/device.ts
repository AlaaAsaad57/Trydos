// Says whether the test is standing on a phone or at a desk.
//
// WHY A TEST HAS TO SAY THIS AT ALL
// `hooks/useIsTouchDevice` asks the browser three questions — is the pointer
// coarse, is the window narrow, does the window carry `ontouchstart` — and the
// answer decides which of two real interfaces the shopper gets. Both ship:
//
//   touch   -> the app draws its own keypad (`ui/NumericKeypad`), fixed to the
//              bottom of the screen, and there is no field to type into.
//   pointer -> a visually hidden `<input>` takes the device's own keyboard.
//
// Left alone, jsdom answers those three questions **inconsistently**: it says
// the pointer is fine and the window is 1024px wide, but it still carries an
// `ontouchstart` property, and one `true` is enough. So every component test
// silently gets the phone interface — including tests written to type into a
// field that, on that branch, was never rendered. The failure reads "cannot
// type into null", which says nothing about the cause.
//
// So a test that renders either input primitive says which device it means:
//
//   beforeEach(() => setDevice("pointer"));
//   afterEach(() => resetDevice());
//
// Nothing here is a fix for jsdom, and nothing here belongs in tests/setup.ts:
// there is no right default, because both branches are real. `tests/setup.ts`
// only supplies `window.matchMedia`, which jsdom lacks entirely, so that asking
// the question does not throw.

type Device = "touch" | "pointer";

/** The window's own `ontouchstart`, kept so `resetDevice` can put it back
 *  exactly as jsdom had it rather than guessing. */
let originalTouchDescriptor: PropertyDescriptor | undefined;
let captured = false;

/** The three signals `useIsTouchDevice` reads, set to agree with each other. */
export function setDevice(device: Device): void {
  if (!captured) {
    originalTouchDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "ontouchstart",
    );
    captured = true;
  }

  const isTouch = device === "touch";

  // 1. The pointer, and any other media query, answered for this device.
  window.matchMedia = ((query: string) => ({
    media: query,
    matches: isTouch && query.includes("coarse"),
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    addListener: () => {},
    removeListener: () => {},
  })) as typeof window.matchMedia;

  // 2. The window width. The hook treats anything 768px or narrower as a phone,
  //    which is the same breakpoint the layout uses.
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: isTouch ? 390 : 1280,
  });

  // 3. Whether the window carries touch handlers at all. This is the one jsdom
  //    gets wrong on its own, and the one that decides the branch.
  if (isTouch) {
    Object.defineProperty(window, "ontouchstart", {
      configurable: true,
      writable: true,
      value: null,
    });
  } else {
    delete (window as Window & { ontouchstart?: unknown }).ontouchstart;
  }

  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: isTouch ? 5 : 0,
  });
}

/** Put the window back the way jsdom had it. Call it in `afterEach`, or the
 *  next file in the same worker starts on whatever device this one chose. */
export function resetDevice(): void {
  if (!captured) return;

  if (originalTouchDescriptor) {
    Object.defineProperty(window, "ontouchstart", originalTouchDescriptor);
  } else {
    delete (window as Window & { ontouchstart?: unknown }).ontouchstart;
  }
  captured = false;
  originalTouchDescriptor = undefined;
}
