// The device block on the QR approve sheets: the flag and place, the browser
// with its icon, and the system with its icon. Both directions use it:
// - Direction A: the phone sees the browser that showed the QR.
// - Direction B: the signed-in web sees the phone that claimed its QR.
import { describe, expect, it } from "vitest";

import QrDeviceDetails from "components/Login/QrDeviceDetails";

import { renderWithProviders, screen } from "../../render";

const maybePw = (id: string) => document.querySelector<HTMLElement>(`[data-pw="${id}"]`);
const pw = (id: string) => {
  const element = maybePw(id);
  if (!element) throw new Error(`nothing with data-pw="${id}" is on the page`);
  return element;
};
const iconOf = (id: string) => pw(id).querySelector("[data-icon]")?.getAttribute("data-icon");

describe("QrDeviceDetails", () => {
  it("shows the flag, the city and the country name for a full place", async () => {
    await renderWithProviders(
      <QrDeviceDetails
        language="en"
        device={{ browser: "Chrome", os: "Windows", city: "Mumbai", region: "Maharashtra", country: "IN" }}
      />,
    );
    const flag = pw("qr-device-flag");
    expect(flag.getAttribute("src"), "the flag is not the IN flag file").toContain("/icons/flag/in.svg");
    expect(pw("qr-device-place").textContent, "the place does not say the city and the country").toBe(
      "Mumbai, India",
    );
  });

  it("shows the browser and the system, each with its own icon", async () => {
    await renderWithProviders(
      <QrDeviceDetails language="en" device={{ browser: "Chrome", os: "Windows", country: "IN" }} />,
    );
    expect(pw("qr-device-browser").textContent, "the browser name is not shown").toBe("Chrome");
    expect(iconOf("qr-device-browser"), "the browser has no Chrome icon").toBe("chrome");
    expect(pw("qr-device-os").textContent, "the system name is not shown").toBe("Windows");
    expect(iconOf("qr-device-os"), "the system has no Windows icon").toBe("windows");
  });

  it.each([
    ["Mobile Safari", "safari"],
    ["Edge", "edge"],
    ["Firefox", "firefox"],
    ["Samsung Internet", "samsung"],
    ["Opera", "opera"],
    ["Some Browser", "web"],
  ])("gives %s the %s icon", async (browser, icon) => {
    await renderWithProviders(<QrDeviceDetails language="en" device={{ browser }} />);
    expect(iconOf("qr-device-browser"), `${browser} has the wrong icon`).toBe(icon);
  });

  it.each([
    ["iOS", "apple"],
    ["Mac OS", "apple"],
    ["Android", "android"],
    ["Linux", "device"],
  ])("gives the %s system the %s icon", async (os, icon) => {
    await renderWithProviders(<QrDeviceDetails language="en" device={{ os }} />);
    expect(iconOf("qr-device-os"), `${os} has the wrong icon`).toBe(icon);
  });

  it("shows a native app's device name with the icon of its platform", async () => {
    await renderWithProviders(
      <QrDeviceDetails language="en" device={{ name: "Alaa's iPhone", platform: "ios" }} />,
    );
    expect(pw("qr-device-name").textContent, "the app's device name is not shown").toBe(
      "Alaa's iPhone",
    );
    expect(iconOf("qr-device-name"), "an ios device has no Apple icon").toBe("apple");
  });

  // The phone scanner names a web claim "<browser>, <system>". Until the core
  // backend answers browser and os in app/status, the name is all there is.
  it("splits a web claim's name into a browser and a system, and never shows the word web", async () => {
    await renderWithProviders(
      <QrDeviceDetails language="en" device={{ name: "Chrome, iOS", platform: "web" }} />,
    );
    expect(pw("qr-device-browser").textContent, "the browser from the name is not shown").toBe(
      "Chrome",
    );
    expect(iconOf("qr-device-browser"), "the browser from the name has no Chrome icon").toBe("chrome");
    expect(pw("qr-device-os").textContent, "the system from the name is not shown").toBe("iOS");
    expect(iconOf("qr-device-os"), "the system from the name has no Apple icon").toBe("apple");
    expect(screen.queryByText(/web/i), "the platform word 'web' is still on the sheet").toBeNull();
  });

  it("shows no place row when nothing about the place is known", async () => {
    await renderWithProviders(<QrDeviceDetails language="en" device={{ browser: "Chrome" }} />);
    expect(maybePw("qr-device-place"), "a place row shows with no place").toBeNull();
  });

  it("says 'a device' when nothing at all is known", async () => {
    await renderWithProviders(<QrDeviceDetails language="en" device={{}} />);
    expect(screen.getByText(/^a device$/i), "an empty device does not fall back to 'a device'").toBeTruthy();
  });
});
