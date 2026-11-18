import { getLocalizedCountryName } from "utils/countryData";
import type { BagView } from "./bagView";
import type { ProfileAddress } from "./useProfileData";
import type { DeliveryPlace } from "./screens/DeliveryMethodSheet";
import type { BagPhoto, CheckoutAddress } from "./screens/CheckoutPage";

/*
  The real checkout's data for its design (Stage 7d): the checkout
  (AppCheckout) and the purchase done (AppOrderDone) write the address and
  the photos with these, so both screens say the same thing.
*/

/** "14:05:09": the time of the purchase. */
export const clockTime = (when: Date) =>
  [when.getHours(), when.getMinutes(), when.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");

/** The bag card's photos, in the bag's order. */
export function photosOf(view: BagView): BagPhoto[] {
  return view.items.map((item) => ({ id: item.id, src: item.photo, alt: item.name.join(" ") }));
}

/** The country in the page's language; the backend's name when it has no code. */
const countryName = (address: ProfileAddress, language: string) =>
  (address.countryIso && getLocalizedCountryName(address.countryIso, language)) || address.country;

/**
 * The real address as the checkout's card writes it: street and town
 * Regular, the rest with the country Medium (the profile's card does the
 * same, AddressLines).
 */
export function checkoutAddress(address: ProfileAddress, language: string): CheckoutAddress {
  return {
    title: address.title,
    regular: address.area.slice(0, 2).filter(Boolean).join(" | "),
    medium: [...address.area.slice(2), countryName(address, language)].filter(Boolean).join(" | "),
    detail: address.detail,
  };
}

/** The place under the delivery sheet's title: the country, then the province and the town. */
export function deliveryPlace(address: ProfileAddress, language: string): DeliveryPlace {
  const province = address.area[address.area.length - 1] ?? "";
  const town = address.area.length > 1 ? address.area[1] : "";
  const rest = [province, town].filter((part, i, all) => part && all.indexOf(part) === i);
  return {
    country: countryName(address, language),
    rest: rest.length > 0 ? ` | ${rest.join(" | ")}` : "",
  };
}
