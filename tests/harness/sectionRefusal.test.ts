// @vitest-environment node
//
// A dashboard section that draws "Access Denied", and what the case says about it.
//
// CI run 36416474747 failed SD-04 with:
//
//     the Locations section refused to draw: this account does not hold
//     READ_LOCATIONS for this shop
//
// That sentence was false. The account held SUPER_ADMIN the whole time. The
// core backend answered `GET /shop/auth/permissions` with 522 after 19 seconds,
// and the dashboard draws "Access Denied" for as long as it has no permissions
// at all, a late answer included. The case read the block and blamed the
// account.
//
// So the case now asks the core backend itself before it says why. This file
// is that sentence, for each answer the backend can give.
import { describe, expect, it } from "vitest";

import { sectionRefusalReason } from "../e2e/harness/sellerDashboard";

const asked = {
  section: "Locations",
  permission: "READ_LOCATIONS",
  sellerId: "34",
};

const answered = (permissions: string[]) => ({
  ok: true,
  status: 200,
  message: "",
  data: [{ seller_id: 34, permissions }],
});

describe("sectionRefusalReason", () => {
  it("names the core backend when the permissions read itself failed", () => {
    expect(
      sectionRefusalReason({
        ...asked,
        read: { ok: false, status: 522, message: "", data: null },
      }),
    ).toBe(
      "the Locations section refused to draw, and the core backend answered GET /shop/auth/permissions with 522, so the dashboard has no permissions to judge this account by",
    );
  });

  it("quotes what the core backend said when it refused the read", () => {
    expect(
      sectionRefusalReason({
        ...asked,
        read: { ok: false, status: 500, message: "Server Error", data: null },
      }),
    ).toContain("with 500 (Server Error)");
  });

  it("blames the permission only when the core backend says it is missing", () => {
    expect(
      sectionRefusalReason({ ...asked, read: answered(["READ_PRODUCTS"]) }),
    ).toBe(
      "the Locations section refused to draw: the core backend says this account does not hold READ_LOCATIONS for shop 34",
    );
  });

  it("blames the permission when the core backend lists no such shop", () => {
    expect(
      sectionRefusalReason({
        ...asked,
        read: {
          ok: true,
          status: 200,
          message: "",
          data: [{ seller_id: 30, permissions: ["SUPER_ADMIN"] }],
        },
      }),
    ).toContain("does not hold READ_LOCATIONS for shop 34");
  });

  it.each([["READ_LOCATIONS"], ["SUPER_ADMIN"]])(
    "blames the dashboard when the account holds %s and is refused anyway",
    (held) => {
      expect(sectionRefusalReason({ ...asked, read: answered([held]) })).toBe(
        `the Locations section still refuses to draw, while the core backend says this account holds ${held} for shop 34. The dashboard's own GET /shop/auth/permissions never arrived, or the dashboard did not use it`,
      );
    },
  );
});
