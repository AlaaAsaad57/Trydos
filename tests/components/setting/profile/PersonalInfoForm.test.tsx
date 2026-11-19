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
// The flow's own callbacks are exposed as buttons so a case can finish or
// close it the way the real one would.
vi.mock("components/Login/Enhanced/VerifyPhoneFlow", () => ({
  default: ({ verify, onSuccess, onClose }: any) => (
    <div data-testid="verify-phone-flow">
      <button onClick={() => verify("123456", "verification-id")}>flow verify</button>
      <button onClick={() => onSuccess("phone-id-token")}>flow success</button>
      <button onClick={onClose}>flow close</button>
    </div>
  ),
}));

// The email code sheet (a framer-motion layer on <body>) is replaced by its
// two outcomes, as buttons, so a case can finish or close it the way the real
// one would. It shows only while the form gives it an address.
vi.mock("components/DemoApp1/screens/EmailCodeSheet", () => ({
  default: ({ email, onVerified, onClose }: any) =>
    email === null ? null : (
      <div data-testid="email-code-sheet" data-email={email}>
        <button onClick={() => onVerified(email)}>code right</button>
        <button onClick={onClose}>code close</button>
      </div>
    ),
}));

const updateProfile = vi.fn(async (..._args: unknown[]) => ({ success: true }));
const verifyOtpForUpdatePhone = vi.fn(async (..._args: unknown[]) => "phone-id-token");
vi.mock("services/auth", () => ({
  default: {
    UpdateProfile: (...args: unknown[]) => updateProfile(...(args as [])),
    VerifyOtpForUpdatePhone: (...args: unknown[]) =>
      verifyOtpForUpdatePhone(...(args as [])),
  },
}));

import PersonalInfoForm from "components/setting/profile/PersonalInfoForm";
import { EmailVerificationRequiredError } from "services/customerEmail";
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
      screen.getByText("Name Should Be Atleast 8 Characters"),
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
      screen.getByText("Name Should Be Atleast 8 Characters"),
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
      screen.getByText("Phone Number Is Required"),
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
      screen.queryByText("Please Enter A Valid Email Address"),
      "an empty e-mail was refused, although the field is optional",
    ).not.toBeInTheDocument();

    updateProfile.mockClear();
    await user.type(
      screen.getByPlaceholderText("Enter Email"),
      "not-an-address",
    );
    await save(user);

    expect(
      screen.getByText("Please Enter A Valid Email Address"),
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
      screen.getByText("Please Select Your Gender"),
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
      screen.getByText("Name Should Be Atleast 8 Characters"),
      "the name was not refused, so this case cannot show the message clearing",
    ).toBeInTheDocument();

    // Type only into the field under test — this form re-renders and re-scans
    // its country list on every keystroke.
    await user.type(screen.getByPlaceholderText("Enter Full Name"), "lovelace");

    expect(
      screen.queryByText("Name Should Be Atleast 8 Characters"),
      "the name message stayed on screen after the shopper corrected the name",
    ).not.toBeInTheDocument();
  });
});

describe("a save the backend refused", () => {
  /** How the core backend answers a refused save: the field names and their
   *  reasons, written as JSON INSIDE the message string. */
  const refuse = (payload: Record<string, string[]>) =>
    updateProfile.mockRejectedValueOnce(new Error(JSON.stringify(payload)));

  // A changed e-mail no longer goes to the profile save (it is proved with a
  // code first, see "a changed e-mail"), so these cases change the name.
  const typeName = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
    const name = screen.getByPlaceholderText("Enter Full Name");
    await user.clear(name);
    await user.type(name, value);
    return name as HTMLInputElement;
  };

  it("keeps what the shopper typed instead of putting the old value back", async () => {
    const user = userEvent.setup();
    await show();
    refuse({ name: ["name is not allowed"] });

    const name = await typeName(user, "Refused Shopper");
    await save(user);

    expect(
      name.value,
      "the refused save wiped the name the shopper typed, so they have to type it again to fix it",
    ).toBe("Refused Shopper");
  });

  it("shows the backend's reason under the field the backend named", async () => {
    const user = userEvent.setup();
    await show();
    refuse({ name: ["name is not allowed"] });

    await typeName(user, "Refused Shopper");
    await save(user);

    expect(
      await screen.findByText("name is not allowed"),
      "the shopper was not told, at the name field, why the core backend refused it",
    ).toBeInTheDocument();
  });

  it("marks every field the backend named, not only the first", async () => {
    const user = userEvent.setup();
    await show({ email: "old@trydos.test" });
    refuse({
      email: ["email already exists"],
      alternative_phone: ["alternative phone is not valid"],
    });

    await user.type(
      screen.getByPlaceholderText("Enter Alternative Phone"),
      "+10000000009",
    );
    await save(user);

    expect(
      await screen.findByText("email already exists"),
      "a save refused on two fields marked neither the e-mail nor both",
    ).toBeInTheDocument();
    expect(
      screen.getByText("alternative phone is not valid"),
      "the alternative phone has no message slot, so a refusal on it is invisible",
    ).toBeInTheDocument();
  });

  it("takes the backend's message away once the shopper edits that field", async () => {
    const user = userEvent.setup();
    await show();
    refuse({ name: ["name is not allowed"] });

    const name = await typeName(user, "Refused Shopper");
    await save(user);
    await screen.findByText("name is not allowed");

    await user.type(name, "x");

    expect(
      screen.queryByText("name is not allowed"),
      "the backend's message stayed on screen after the shopper changed the name it referred to",
    ).not.toBeInTheDocument();
  });

  it("leaves the form alone when the refusal names no field", async () => {
    const user = userEvent.setup();
    await show();
    updateProfile.mockRejectedValueOnce(new Error("market refused"));

    const name = await typeName(user, "Typed Shopper");
    await save(user);

    // Nothing to place under a field — the notification the request layer
    // already showed is what tells the shopper. What they typed still stands.
    expect(
      name.value,
      "a refusal that named no field still wiped what the shopper typed",
    ).toBe("Typed Shopper");
    expect(
      screen.queryByText("market refused"),
      "a message that names no field was placed under a field anyway",
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
      screen.queryByText("Phone Number Is Required"),
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

describe("finishing a phone change", () => {
  const changePhone = async (user: ReturnType<typeof userEvent.setup>) => {
    const phone = screen.getByPlaceholderText("Enter Phone");
    await user.clear(phone);
    await user.type(phone, "+10000000001");
    await save(user);
  };

  it("verifies the new number, then saves it with the phone token and only the changed fields", async () => {
    const user = userEvent.setup();
    await show();
    await changePhone(user);

    await user.click(screen.getByText("flow verify"));
    expect(
      verifyOtpForUpdatePhone,
      "the new number was not verified against the phone-update check",
    ).toHaveBeenCalledWith("123456", "verification-id");

    await user.click(screen.getByText("flow success"));
    expect(
      updateProfile.mock.calls[0]?.[0],
      "the save did not carry the new number and its phone token, and only those",
    ).toEqual({ phone: "+10000000001", id_token: "phone-id-token" });
    expect(screen.queryByTestId("auth-overlay"), "the re-verify step stayed open after the save").not.toBeInTheDocument();
  });

  it("closing the re-verify step saves nothing", async () => {
    const user = userEvent.setup();
    await show();
    await changePhone(user);
    await user.click(screen.getByText("flow close"));
    expect(screen.queryByTestId("auth-overlay"), "closing the re-verify step left it open").not.toBeInTheDocument();
    expect(updateProfile, "closing the re-verify step still saved").not.toHaveBeenCalled();
  });
});

describe("a changed e-mail", () => {
  /*
    The core backend saves a new e-mail only through its code check
    (send-otp, then verify-otp), and the right code is what saves it. So the
    form opens the code sheet itself when the e-mail changed, before any save,
    and the profile save never carries the new e-mail.

    The form does not wait for the backend to refuse the save first (that
    refusal, "verify the new email" with 400, is backend PR #699). Before #699
    is live the backend took the new e-mail with no code at all; that was the
    bug (2026-11-19). The 400 is still handled, as a second net.
  */
  const OLD = "old@trydos.test";
  const NEW = "new@trydos.test";

  const typeEmail = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
    const email = screen.getByPlaceholderText("Enter Email");
    await user.clear(email);
    if (value) await user.type(email, value);
  };

  it("opens the code sheet for the new e-mail instead of saving", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, NEW);
    await save(user);

    expect(
      screen.queryByTestId("email-code-sheet")?.getAttribute("data-email"),
      "a new e-mail did not open the code sheet for that address",
    ).toBe(NEW);
    expect(
      updateProfile,
      "the new e-mail went to the core backend's profile save before its code was checked",
    ).not.toHaveBeenCalled();
  });

  it("asks the code for the e-mail as the backend saves it: trimmed and in lowercase", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, "  New@Trydos.TEST ");
    await save(user);

    expect(
      screen.queryByTestId("email-code-sheet")?.getAttribute("data-email"),
      "the code sheet was not opened for the trimmed, lowercase address",
    ).toBe(NEW);
  });

  it("after a right code, saves the other changed fields without the e-mail", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, NEW);
    const name = screen.getByPlaceholderText("Enter Full Name");
    await user.clear(name);
    await user.type(name, "Renamed Shopper");
    await save(user);

    await user.click(screen.getByText("code right"));

    expect(
      updateProfile.mock.calls[0]?.[0],
      "after the code saved the e-mail, the profile save did not carry only the new name",
    ).toEqual({ name: "Renamed Shopper" });
    expect(
      screen.queryByTestId("email-code-sheet"),
      "the code sheet stayed open after a right code",
    ).not.toBeInTheDocument();
  });

  it("after a right code, sends no profile save when the e-mail was the only change", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, NEW);
    await save(user);

    await user.click(screen.getByText("code right"));

    expect(
      updateProfile,
      "the code already saved the e-mail, but the form still sent a profile save",
    ).not.toHaveBeenCalled();
  });

  it("does not ask a second code when a later save is refused and sent again", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    updateProfile.mockRejectedValueOnce(
      new Error(JSON.stringify({ name: ["name is not allowed"] })),
    );
    await typeEmail(user, NEW);
    const name = screen.getByPlaceholderText("Enter Full Name");
    await user.clear(name);
    await user.type(name, "Refused Shopper");
    await save(user);
    await user.click(screen.getByText("code right"));
    await screen.findByText("name is not allowed");

    await user.clear(name);
    await user.type(name, "Renamed Shopper");
    await save(user);

    expect(
      screen.queryByTestId("email-code-sheet"),
      "the e-mail was already proved with a code, but the second save asked for a code again",
    ).not.toBeInTheDocument();
    expect(
      updateProfile.mock.calls[1]?.[0],
      "the second save did not carry only the corrected name",
    ).toEqual({ name: "Renamed Shopper" });
  });

  it("closing the code sheet saves nothing", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, NEW);
    await save(user);

    await user.click(screen.getByText("code close"));

    expect(
      screen.queryByTestId("email-code-sheet"),
      "closing the code sheet left it open",
    ).not.toBeInTheDocument();
    expect(updateProfile, "closing the code sheet still saved the profile").not.toHaveBeenCalled();
  });

  it("asks no code for the same e-mail in another case, and saves directly", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, "OLD@trydos.test");
    await save(user);

    expect(
      screen.queryByTestId("email-code-sheet"),
      "the saved e-mail in capitals is the same address, but the form asked for a code",
    ).not.toBeInTheDocument();
    expect(
      updateProfile,
      "the same e-mail in another case was not saved directly",
    ).toHaveBeenCalledTimes(1);
  });

  it("asks no code for a cleared e-mail, and saves directly", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, "");
    await save(user);

    expect(
      screen.queryByTestId("email-code-sheet"),
      "a cleared e-mail has no address to send a code to, but the form asked for one",
    ).not.toBeInTheDocument();
    expect(
      updateProfile.mock.calls[0]?.[0],
      "the cleared e-mail was not saved directly",
    ).toEqual({ email: "" });
  });

  it("still opens the code sheet when the core backend asks for the code (the 400)", async () => {
    const user = userEvent.setup();
    // The form sees the same address (only the case differs), so it saves
    // directly; the backend answers "verify the new email" anyway.
    await show({ email: OLD });
    updateProfile.mockRejectedValueOnce(new EmailVerificationRequiredError());
    await typeEmail(user, "Old@trydos.test");
    await save(user);

    expect(
      (await screen.findByTestId("email-code-sheet")).getAttribute("data-email"),
      "the core backend asked for the e-mail code, but the code sheet did not open for that address",
    ).toBe(OLD);

    // The right code saved the e-mail; sending it again would get the same 400.
    await user.click(screen.getByText("code right"));
    expect(
      updateProfile,
      "after the code the form sent the e-mail to the profile save again, which the core backend refuses with the same 400",
    ).toHaveBeenCalledTimes(1);
  });

  it("with a new phone and a new e-mail: the phone first, then the code, then one save with the phone token", async () => {
    const user = userEvent.setup();
    await show({ email: OLD });
    await typeEmail(user, NEW);
    const phone = screen.getByPlaceholderText("Enter Phone");
    await user.clear(phone);
    await user.type(phone, "+10000000001");
    await save(user);

    await user.click(screen.getByText("flow success"));
    expect(
      screen.queryByTestId("email-code-sheet")?.getAttribute("data-email"),
      "after the new phone was proved, the code sheet did not open for the new e-mail",
    ).toBe(NEW);
    expect(updateProfile, "the profile was saved before the new e-mail's code was checked").not.toHaveBeenCalled();

    await user.click(screen.getByText("code right"));
    expect(
      updateProfile.mock.calls[0]?.[0],
      "the save after both checks did not carry the new phone and its token, without the e-mail",
    ).toEqual({ phone: "+10000000001", id_token: "phone-id-token" });
  });
});

describe("the other field checks", () => {
  it("refuses a phone number that is not valid, and clears the message on edit", async () => {
    const user = userEvent.setup();
    await show();
    const phone = screen.getByPlaceholderText("Enter Phone");
    await user.clear(phone);
    await user.type(phone, "+12");
    await save(user);
    expect(
      screen.getByText("Please Enter A Valid Phone Number"),
      "a phone number that is too short was not refused",
    ).toBeInTheDocument();
    await user.type(phone, "3");
    expect(
      screen.queryByText("Please Enter A Valid Phone Number"),
      "editing the phone did not clear its message",
    ).not.toBeInTheDocument();
  });

  it("clears a refusal on the alternative phone once it is edited", async () => {
    const user = userEvent.setup();
    await show();
    updateProfile.mockRejectedValueOnce(
      new Error(JSON.stringify({ alternative_phone: ["alternative phone is not valid"] })),
    );
    const alt = screen.getByPlaceholderText("Enter Alternative Phone");
    await user.type(alt, "+10000000009");
    await save(user);
    await screen.findByText("alternative phone is not valid");
    await user.type(alt, "1");
    expect(
      screen.queryByText("alternative phone is not valid"),
      "editing the alternative phone did not clear its message",
    ).not.toBeInTheDocument();
  });

  it.each([
    ["Woman", 2],
    ["Other", 3],
    ["Man", 1],
  ])("choosing %s saves gender %s when it changed", async (label, value) => {
    const user = userEvent.setup();
    await show({ gender: value === 1 ? 2 : 1 });
    await user.click(screen.getByText(label));
    expect(
      screen.getByText(label).getAttribute("data-pw"),
      `${label} is not marked as the chosen gender`,
    ).toBe("active-gender-input");
    await save(user);
    expect(updateProfile.mock.calls[0]?.[0], `the gender change to ${label} was not saved`).toEqual({ gender: value });
  });
});
