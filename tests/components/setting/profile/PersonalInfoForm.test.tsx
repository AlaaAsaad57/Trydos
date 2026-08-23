// The personal-details form, and the four things it decides without a backend.
//
// Everything here is a gate in front of a save. If a gate is wrong the shopper
// either cannot save details that are perfectly valid, or saves something the
// backend will reject later with a worse message.
//
// ---------------------------------------------------------------------------
// Three things worth knowing before reading the cases
//
// **The empty-name message is blunt on purpose.** `validateFunction` sets the
// "required" message first and the minimum-length message second, and the second
// overwrites the first — so an empty name reports the length message, not the
// required one. That was looked at and accepted (OQ-6): an empty name *is* also
// a name below the minimum, so the message is blunt rather than wrong. These
// cases record what the screen really says. If that is ever changed, this file
// is where it will go red, which is the point.
//
// **A guest is stopped before validation, not by it.** `handleSave` opens the
// sign-in surface and returns before it validates anything, so a guest with an
// empty form sees no validation messages at all — they see the login surface.
//
// **A changed phone number replaces the save.** It does not accompany it: the
// re-verify overlay opens and the save is not attempted, because the number has
// to be proven before the account can carry it.
//
// ---------------------------------------------------------------------------
// What is stubbed, and why
//
// `AuthOverlay` mounts the scaled canvas — `:root` variables and a `<style>` tag
// its cleanup never removes — so a real mount leaks into every later case in
// this file, and `tests/render.tsx` says in writing that it never mounts that
// canvas. The profile service is stubbed because the unit setup treats an
// unhandled request as an error and that service pulls a wide graph; it is also
// the seam that lets these cases assert a save did **not** happen.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("components/Login/Enhanced/AuthOverlay", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-overlay">{children}</div>
  ),
}));
vi.mock("components/Login/Enhanced/VerifyPhoneFlow", () => ({
  default: () => <div data-testid="verify-phone-flow" />,
}));

const updateProfile = vi.fn(async () => ({ success: true }));
vi.mock("services/auth", () => ({
  default: {
    UpdateProfile: (...args: unknown[]) => updateProfile(...(args as [])),
  },
}));

import PersonalInfoForm from "components/setting/profile/PersonalInfoForm";
import { buildUser } from "../../../fixtures/user";
import { renderWithProviders, screen, userEvent } from "../../../render";

/** An account the form has nothing to complain about.
 *
 *  Every value is an obviously fake constant from the shared builder — these
 *  files are committed to a public repository and must never carry a real
 *  identity or read one from the environment. */
const COMPLETE = {
  ...buildUser({ name: "Test Shopper" }),
  gender: 1,
  alternative_phone: "",
};

const show = (overrides: Record<string, unknown> = {}) =>
  renderWithProviders(
    <PersonalInfoForm
      initialData={{ ...COMPLETE, ...overrides }}
      isRtl={false}
      language="en"
      local="gb-en"
    />,
    { store: { userProfile: { ...COMPLETE, ...overrides } } },
  );

const save = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText("Save"));
};

beforeEach(() => {
  updateProfile.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("what the form refuses to save (AC-6)", () => {
  it("refuses an empty name, with the message the screen really shows", async () => {
    const user = userEvent.setup();
    await show({ name: "" });

    await save(user);

    // The blunt one. See the note at the top: the length rule overwrites the
    // required rule, and that was accepted rather than fixed.
    expect(
      screen.getByText("Name Should be atleast 8 characters"),
      "an empty name was accepted, or was refused with a message this screen does not actually show",
    ).toBeInTheDocument();
    expect(
      updateProfile,
      "the form saved a profile with no name on it",
    ).not.toHaveBeenCalled();
  });

  it("refuses a name below the minimum length", async () => {
    const user = userEvent.setup();
    await show({ name: "Ada" });

    await save(user);

    expect(
      screen.getByText("Name Should be atleast 8 characters"),
      "a name shorter than the minimum was accepted",
    ).toBeInTheDocument();
    expect(
      updateProfile,
      "the form saved a name shorter than the minimum it enforces",
    ).not.toHaveBeenCalled();
  });

  it("refuses a phone number the shopper has cleared", async () => {
    const user = userEvent.setup();
    // Seeded with a real number and cleared in the form, **not** rendered with
    // an empty one: a visitor whose stored number is empty is treated as not
    // signed in, so `handleSave` opens the sign-in surface and returns before
    // it validates anything. Rendering it empty would test AC-8 by accident and
    // never reach this rule at all.
    await show();

    await user.clear(screen.getByPlaceholderText("Enter Phone"));
    await save(user);

    expect(
      screen.getByText("Phone number is required"),
      "a signed-in shopper cleared their phone number and the form accepted it",
    ).toBeInTheDocument();
    expect(
      updateProfile,
      "the form saved a profile whose phone number had been cleared",
    ).not.toHaveBeenCalled();
  });

  it("refuses an e-mail that is not an e-mail, while it is optional when empty", async () => {
    const user = userEvent.setup();
    await show({ email: "" });

    // Empty is fine — prove that first, or the case below proves nothing.
    await save(user);
    expect(
      screen.queryByText("Please enter a valid email address"),
      "an empty e-mail was refused, although the field is optional",
    ).not.toBeInTheDocument();

    updateProfile.mockClear();
    await user.type(
      screen.getByPlaceholderText("Enter Email"),
      "not-an-address",
    );
    await save(user);

    expect(
      screen.getByText("Please enter a valid email address"),
      "an e-mail that is not an address was accepted",
    ).toBeInTheDocument();
    expect(
      updateProfile,
      "the form saved an e-mail that is not an address",
    ).not.toHaveBeenCalled();
  });

  it("refuses a profile with no gender chosen", async () => {
    const user = userEvent.setup();
    await show({ gender: undefined });

    await save(user);

    expect(
      screen.getByText("Please select your gender"),
      "a profile with no gender chosen was accepted",
    ).toBeInTheDocument();
    expect(
      updateProfile,
      "the form saved a profile with no gender chosen",
    ).not.toHaveBeenCalled();
  });
});

describe("correcting a field (AC-7)", () => {
  it("takes the message away once the field it belongs to is fixed", async () => {
    const user = userEvent.setup();
    await show({ name: "Ada" });

    await save(user);
    expect(
      screen.getByText("Name Should be atleast 8 characters"),
      "the name was not refused, so this case cannot show the message clearing",
    ).toBeInTheDocument();

    // Type only into the field under test — this form re-renders and re-scans
    // its country list on every keystroke.
    await user.type(screen.getByPlaceholderText("Enter Full Name"), "lovelace");

    expect(
      screen.queryByText("Name Should be atleast 8 characters"),
      "the name message stayed on screen after the shopper corrected the name",
    ).not.toBeInTheDocument();
  });
});

describe("a visitor who is not signed in (AC-8)", () => {
  const GUEST = { phone: "0", name: "", gender: undefined };

  it("gets the sign-in surface instead of a save", async () => {
    const user = userEvent.setup();
    const { store } = await show(GUEST);

    await save(user);

    expect(
      store.getState().loginOpen,
      "a visitor who is not signed in pressed Save and was not offered the sign-in surface",
    ).toBe(true);
    expect(
      updateProfile,
      "a visitor who is not signed in was allowed to save a profile",
    ).not.toHaveBeenCalled();
  });

  it("is stopped before validation, so no validation messages appear", async () => {
    const user = userEvent.setup();
    await show(GUEST);

    await save(user);

    // The form is empty and would fail every rule — but a guest never reaches
    // them. Showing the rules here would be telling them to fix a form they are
    // not allowed to submit.
    expect(
      screen.queryByText("Phone number is required"),
      "a visitor who is not signed in was shown validation messages instead of the sign-in surface",
    ).not.toBeInTheDocument();
  });
});

describe("a changed phone number (AC-9)", () => {
  it("opens the re-verify step instead of saving", async () => {
    const user = userEvent.setup();
    await show();

    const phone = screen.getByPlaceholderText("Enter Phone");
    await user.clear(phone);
    await user.type(phone, "+10000000001");
    await save(user);

    expect(
      screen.getByTestId("auth-overlay"),
      "the shopper changed their number and the re-verify step never opened",
    ).toBeInTheDocument();
    expect(
      updateProfile,
      "the shopper's new number was saved without being verified first",
    ).not.toHaveBeenCalled();
  });

  it("saves directly when the number was not touched", async () => {
    const user = userEvent.setup();
    await show();

    await user.type(screen.getByPlaceholderText("Enter Full Name"), " Two");
    await save(user);

    expect(
      screen.queryByTestId("auth-overlay"),
      "the shopper was asked to re-verify a number they never changed",
    ).not.toBeInTheDocument();
    expect(
      updateProfile,
      "a valid profile with an unchanged number was not saved",
    ).toHaveBeenCalled();
  });
});
