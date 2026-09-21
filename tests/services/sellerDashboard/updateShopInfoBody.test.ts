// What `PUT /shop/info` is actually sent, and why a shop with no logo used to
// be unable to save its own address.
//
// `ShopInfo.tsx` builds the media fields with `normializeImage`, which answers
// `null` for a shop that has no picture. That `null` went straight into the
// body, and the core backend refuses it:
//
//     422  The image field must be a string.   (fields: image, banner)
//
// So the whole save was refused — name, address and contact included — for any
// seller who had never uploaded a logo. Nothing on the screen said why: the form
// raised its generic "Failed to update".
//
// The fix is to leave a media field out when there is no media to send. `PUT`
// here rewrites every field it is **given**, so sending nothing for a picture is
// "do not touch it", which is exactly right both for a shop that has none and
// for one whose picture this save is not changing.
//
// Seen on the browser suite as `SD-12 a contact and address change reaches the
// backend, and is put back`, red on every run against staging.

import { describe, expect, it, vi } from "vitest";

const fetchData = vi.fn().mockResolvedValue({ success: true });

vi.mock("utils/fetchData", () => ({
  default: (...args: unknown[]) => fetchData(...args),
  fetchData: (...args: unknown[]) => fetchData(...args),
}));

import sellerDashboard from "services/sellerDashboard";

/** The body the service actually sent, parsed back from the request. */
const sentBody = (): Record<string, unknown> => {
  const call = fetchData.mock.calls.at(-1)?.[0] as { body?: string } | undefined;
  return JSON.parse(call?.body ?? "{}");
};

describe("updateShopInfo — the body sent to PUT /shop/info", () => {
  it("leaves out a picture the shop does not have, rather than sending null", async () => {
    fetchData.mockClear();

    await sellerDashboard.updateShopInfo("77", {
      name: "Trydos QA shop",
      address: "a new address",
      contact: "0900000000",
      image: null,
      banner: null,
    });

    const body = sentBody();

    // The whole point. `null` is what the backend refuses with
    // "The image field must be a string", and it refuses the entire save with
    // it — the address below never reaches the shop.
    expect(
      "image" in body,
      "a shop with no logo still sends `image`, and the core backend answers 422 The image field must be a string — which refuses the address change too",
    ).toBe(false);
    expect(
      "banner" in body,
      "a shop with no banner still sends `banner`, and the core backend answers 422 The banner field must be a string",
    ).toBe(false);

    // The fields the seller actually changed must still be there, or this would
    // pass by sending nothing at all.
    expect(
      body.address,
      "the address the seller typed is not in the body, so the save would change nothing",
    ).toBe("a new address");
    expect(
      body.contact,
      "the contact the seller typed is not in the body",
    ).toBe("0900000000");
    expect(body.name, "the shop name is not in the body").toBe(
      "Trydos QA shop",
    );
  });

  it("sends a picture the shop does have, so the save does not wipe it", async () => {
    fetchData.mockClear();

    await sellerDashboard.updateShopInfo("77", {
      name: "Trydos QA shop",
      address: "a new address",
      contact: "0900000000",
      image: "logo.png",
      banner: "banner.png",
    });

    const body = sentBody();

    // The opposite failure, and it is the worse one: `PUT /shop/info` rewrites
    // every field it is given, so a save that dropped a picture the shop HAS
    // would delete the seller's logo while putting their address right.
    expect(
      body.image,
      "the shop's existing logo is not in the body, so this save would wipe it",
    ).toBe("logo.png");
    expect(
      body.banner,
      "the shop's existing banner is not in the body, so this save would wipe it",
    ).toBe("banner.png");
  });
});
