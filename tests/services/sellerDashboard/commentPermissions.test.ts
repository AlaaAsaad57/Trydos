// The permission keys that gate the seller-dashboard comments tab.
//
// These strings must match, letter for letter, what the market backend returns
// in each shop's `permissions` array. The server actions in
// services/elastic/sellerComments.ts check them before touching any comment, so
// a changed key silently locks every seller out of their comments.
import { describe, expect, it } from "vitest";

import {
  COMMENT_PERMISSIONS,
  SUPER_ADMIN,
} from "services/sellerDashboard/commentPermissions";

describe("comment permission keys", () => {
  it("match the keys the market backend sends", () => {
    expect(COMMENT_PERMISSIONS.READ, "the read key changed").toBe("READ_COMMENTS");
    expect(COMMENT_PERMISSIONS.REPLY, "the reply key changed").toBe("REPLY_COMMENT");
    expect(COMMENT_PERMISSIONS.EDIT_REPLY, "the edit-reply key changed").toBe("EDIT_REPLY");
    expect(COMMENT_PERMISSIONS.DELETE_REPLY, "the delete-reply key changed").toBe("DELETE_REPLY");
    expect(SUPER_ADMIN, "the super-admin key changed").toBe("SUPER_ADMIN");
  });
});
