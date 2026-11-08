// The height and weight screen (components/settings/ProfileSizeInfo.tsx).
//
// Save checks both values (height 110-250 cm, weight 40-180 kg), shows the
// error under each bad field, and clears an error as soon as that field is
// edited. A good save updates the profile and goes back to it. Arabic shows
// Arabic-Indic digits and accepts them as input.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateProfile = vi.hoisted(() => vi.fn());
vi.mock("services/auth", () => ({ default: { UpdateProfile: updateProfile } }));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

import ProfileSizeInfo from "components/settings/ProfileSizeInfo";
import { restoreLocation, stubLocation, type LocationStub } from "../../mocks/location";
import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from "../../render";

const tall = () => document.querySelector('[data-pw="personal-size-tall-input"]') as HTMLInputElement;
const weight = () => document.querySelector('[data-pw="personal-size-weight-input"]') as HTMLInputElement;
const foot = () => document.querySelector('[data-pw="personal-size-foot-input"]') as HTMLInputElement;
const save = () => document.querySelector('[data-pw="personal-size-save-button"]') as HTMLElement;

let location: LocationStub;
beforeEach(() => {
  updateProfile.mockReset();
  updateProfile.mockResolvedValue({ success: true });
  logError.mockReset();
});
afterEach(() => {
  restoreLocation();
  vi.clearAllMocks();
});

function renderSize(initialData: any = { tall: 170, weight: 70 }, local = "gb-en") {
  const language = local.split("-")[1] as any;
  return renderWithProviders(
    <ProfileSizeInfo local={local} initialData={initialData} isRtl={language === "ar"} />,
    { language },
  );
}

describe("checking the values", () => {
  it.each([
    [{}, "Height Is Required", "Weight Is Required"],
    [{ tall: 100, weight: 30 }, "Height Must Be Between 110 And 250 cm", "Weight Must Be Between 40 And 180 kg"],
    [{ tall: 260, weight: 190 }, "Height Must Be Between 110 And 250 cm", "Weight Must Be Between 40 And 180 kg"],
  ])("refuses %o and names both problems", async (initial, tallError, weightError) => {
    await renderSize(initial);
    await userEvent.setup().click(save());
    expect(screen.getByText(tallError), `the height error "${tallError}" is not shown`).toBeInTheDocument();
    expect(screen.getByText(weightError), `the weight error "${weightError}" is not shown`).toBeInTheDocument();
    expect(updateProfile, "bad values were sent to the profile").not.toHaveBeenCalled();
  });

  it("clears each error once its field is edited", async () => {
    await renderSize(null);
    await userEvent.setup().click(save());
    fireEvent.change(tall(), { target: { value: "180" } });
    expect(screen.queryByText("Height Is Required"), "editing the height kept its error").not.toBeInTheDocument();
    fireEvent.change(weight(), { target: { value: "80" } });
    expect(screen.queryByText("Weight Is Required"), "editing the weight kept its error").not.toBeInTheDocument();
    fireEvent.change(tall(), { target: { value: "181" } });
    fireEvent.change(weight(), { target: { value: "81" } });
    expect(tall().value, "the height input did not take the new value").toBe("181");
  });
});

describe("saving", () => {
  it("sends good values to the profile and returns to it", async () => {
    location = stubLocation();
    const initial = { tall: 170, weight: 70 };
    await renderSize(initial);
    fireEvent.change(tall(), { target: { value: "175" } });
    await userEvent.setup().click(save());
    expect(updateProfile, "the new size was not sent with the current profile").toHaveBeenCalledWith(
      { tall: 175, weight: 70 },
      initial,
    );
    await waitFor(() =>
      expect(location.href, "a good save did not return to the profile").toBe("/gb-en/settings/profile"),
    );
  });

  it("logs a failed save and stays", async () => {
    location = stubLocation();
    updateProfile.mockRejectedValue(new Error("profile down"));
    await renderSize();
    await userEvent.setup().click(save());
    await waitFor(() =>
      expect(logError, "a failed save was not logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In updateUserProfile in ProfileSizeInfo" }),
      ),
    );
    expect(location.href, "a failed save still left the screen").toBeNull();
  });
});

describe("the foot size", () => {
  const size = { tall: 170, weight: 70 };
  const sent = () => updateProfile.mock.calls[0]?.[0];
  const saved = () =>
    waitFor(() => expect(updateProfile, "the save never reached the profile").toHaveBeenCalled());

  beforeEach(() => {
    location = stubLocation();
  });

  it("starts from foot_size, and is empty for a customer with null", async () => {
    const first = await renderSize({ ...size, foot_size: 38 });
    expect(foot().value, "the field should show foot_size from the profile").toBe("38");
    first.unmount();
    await renderSize({ ...size, foot_size: null });
    expect(foot().value, "a null foot_size should be an empty field").toBe("");
  });

  it("is not sent when it did not change, so a customer with null keeps null", async () => {
    await renderSize({ ...size, foot_size: null });
    fireEvent.change(tall(), { target: { value: "175" } });
    await userEvent.setup().click(save());
    await saved();
    expect(sent(), "an untouched foot size was sent to the core backend").not.toHaveProperty("foot_size");
    expect(sent()?.tall, "the new height was not sent").toBe(175);
  });

  it("sends a new foot size as a number", async () => {
    await renderSize({ ...size, foot_size: null });
    fireEvent.change(foot(), { target: { value: "42.5" } });
    await userEvent.setup().click(save());
    await saved();
    expect(sent()?.foot_size, "the core backend should get foot_size as a number").toBe(42.5);
  });

  it("sends a cleared foot size as null", async () => {
    await renderSize({ ...size, foot_size: 38 });
    fireEvent.change(foot(), { target: { value: "" } });
    await userEvent.setup().click(save());
    await saved();
    expect(sent()?.foot_size, "clearing the field should send foot_size: null").toBeNull();
  });

  it.each(["20", "55"])("takes %s, an end of the EU range", async (value) => {
    await renderSize({ ...size, foot_size: null });
    fireEvent.change(foot(), { target: { value } });
    await userEvent.setup().click(save());
    await saved();
    expect(sent()?.foot_size, `the foot size ${value} should be sent`).toBe(Number(value));
  });

  it.each(["19.5", "55.5", "4.2.1", "."])("refuses %s and sends nothing", async (value) => {
    await renderSize({ ...size, foot_size: null });
    fireEvent.change(foot(), { target: { value } });
    await userEvent.setup().click(save());
    expect(
      screen.getByText("Foot Size Must Be Between 20 And 55"),
      "the refusal is not shown under the field",
    ).toBeInTheDocument();
    expect(updateProfile, `the foot size ${value} was sent`).not.toHaveBeenCalled();
  });

  it("clears its error once the field is edited", async () => {
    await renderSize({ ...size, foot_size: null });
    fireEvent.change(foot(), { target: { value: "99" } });
    await userEvent.setup().click(save());
    fireEvent.change(foot(), { target: { value: "42" } });
    expect(
      screen.queryByText("Foot Size Must Be Between 20 And 55"),
      "editing the foot size kept its error",
    ).not.toBeInTheDocument();
  });

  it("is optional: an empty foot size does not stop a save", async () => {
    await renderSize(size);
    await userEvent.setup().click(save());
    await saved();
    expect(sent(), "an empty foot size that never changed was sent").not.toHaveProperty("foot_size");
  });

  it("shows Arabic-Indic digits and sends them as a number", async () => {
    await renderSize({ ...size, foot_size: null }, "gb-ar");
    fireEvent.change(foot(), { target: { value: "٤٢" } });
    expect(foot().value, "the foot size is not shown in Arabic-Indic digits").toBe("٤٢");
    await userEvent.setup().click(save());
    await saved();
    expect(sent()?.foot_size, "Arabic-Indic input was not sent as a number").toBe(42);
  });

  it("reads the Arabic decimal mark as a dot", async () => {
    await renderSize({ ...size, foot_size: null }, "gb-ar");
    fireEvent.change(foot(), { target: { value: "٤٢٫٥" } });
    await userEvent.setup().click(save());
    await saved();
    expect(sent()?.foot_size, "an Arabic half size was not sent as 42.5").toBe(42.5);
  });
});

describe("in Arabic", () => {
  it("shows Arabic-Indic digits and reads them back as numbers", async () => {
    await renderSize({ tall: 170, weight: 0 }, "gb-ar");
    expect(tall().value, "the height is not shown in Arabic-Indic digits").toBe("١٧٠");
    expect(weight().value, "a zero weight is not shown as an Arabic zero").toBe("٠");
    fireEvent.change(weight(), { target: { value: "٨٥" } });
    expect(weight().value, "Arabic-Indic input was not read as a number").toBe("٨٥");
    expect(tall().placeholder, "the placeholder digits are not Arabic-Indic").not.toMatch(/[0-9]/);
  });
});
