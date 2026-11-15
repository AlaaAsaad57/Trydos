"use client";

import { translateFunction } from "utils/functions";
import { getLocalizedCountryName } from "utils/countryData";
import { BrowserIcon, SystemIcon, browserKind, systemKind } from "components/Login/QrDeviceIcons";
import "public/styles/qrLogin.css";

/** What the approve sheet knows about the other device. Every field may be missing. */
export type QrDeviceInfo = {
  browser?: string | null;
  os?: string | null;
  city?: string | null;
  region?: string | null;
  /** 2-letter country code, such as "SY". */
  country?: string | null;
  /** The device name from app/claim, such as "Alaa's iPhone" or "Chrome, iOS". */
  name?: string | null;
  /** The platform from app/claim: "ios", "android" or "web". */
  platform?: string | null;
};

type Props = { device: QrDeviceInfo; language: string };

const COUNTRY_CODE = /^[A-Za-z]{2}$/;

/**
 * The browser and the system of a web claim. The phone scanner
 * (app/api/qr-login/scan/claim) names a web claim "<browser>, <system>". The
 * core backend does not answer browser and os in app/status yet, so the name
 * is all there is. Splitting it gives each part its own icon.
 */
function browserAndSystem(device: QrDeviceInfo) {
  if (device.browser || device.os) return { browser: device.browser, os: device.os };
  if (device.platform === "web" && device.name?.includes(", ")) {
    const [browser, os] = device.name.split(", ");
    return { browser, os };
  }
  return { browser: null, os: null };
}

/**
 * The other device on a QR approve sheet: the flag with the city and country,
 * then the browser and the system, each with its icon. Names come from the
 * user agent or Cloudflare, so they need no translation; the country name
 * comes from Intl in the page's language.
 */
function QrDeviceDetails({ device, language }: Props) {
  const t = (key: string) => translateFunction(key, language);
  const { browser, os } = browserAndSystem(device);
  const country = device.country && COUNTRY_CODE.test(device.country) ? device.country.toLowerCase() : null;
  const town = device.city || device.region;
  const placeParts = [town, country ? getLocalizedCountryName(country, language) : null].filter(
    (part): part is string => Boolean(part),
  );
  // A native app claim: only a device name and a platform.
  const name = !browser && !os ? device.name : null;

  if (!placeParts.length && !browser && !os && !name) {
    return (
      <div className="qr-sheet-ctx" data-pw="qr-device">
        {t("a device")}
      </div>
    );
  }

  return (
    <div className="qr-device" data-pw="qr-device">
      {placeParts.length > 0 && (
        <div className="qr-device-place-row">
          {country && (
            <img
              className="qr-device-flag"
              data-pw="qr-device-flag"
              src={`/icons/flag/${country}.svg`}
              alt=""
              width={24}
              height={16}
              // An unknown code has no flag file. Hide it, the name still shows.
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span data-pw="qr-device-place">
            {placeParts.map((part, i) => (
              <bdi key={i}>
                {i > 0 && ", "}
                {part}
              </bdi>
            ))}
          </span>
        </div>
      )}
      {(browser || os || name) && (
        <div className="qr-device-chips">
          {browser && (
            <span className="qr-device-chip" data-pw="qr-device-browser">
              <BrowserIcon kind={browserKind(browser)} />
              <bdi>{browser}</bdi>
            </span>
          )}
          {os && (
            <span className="qr-device-chip" data-pw="qr-device-os">
              <SystemIcon kind={systemKind(os)} />
              <bdi>{os}</bdi>
            </span>
          )}
          {name && (
            <span className="qr-device-chip" data-pw="qr-device-name">
              <SystemIcon kind={systemKind(`${device.platform || ""} ${name}`)} />
              <bdi>{name}</bdi>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default QrDeviceDetails;
