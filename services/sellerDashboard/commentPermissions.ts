// Permission keys that gate the seller-dashboard comments tab.
//
// These are the SAME strings the market (Go) backend returns inside each shop's
// `permissions` array from `GET /shop/auth/permissions`. They are enforced
// server-side in `services/elastic/sellerComments.ts` (the real security
// boundary) and reused in the dashboard UI only to show/hide controls.
//
// Plain module (no "use server" / "use client") so it can be imported from both
// the server actions and the client dashboard page.
export const COMMENT_PERMISSIONS = {
  /** Read the shop's own comments/reviews. */
  READ: "READ_COMMENTS",
  /** Create a seller reply on a comment. */
  REPLY: "REPLY_COMMENT",
  /** Edit an existing seller reply. */
  EDIT_REPLY: "EDIT_REPLY",
  /** Remove a seller reply. */
  DELETE_REPLY: "DELETE_REPLY",
} as const;

/** Super admin bypasses individual permission checks (matches the dashboard). */
export const SUPER_ADMIN = "SUPER_ADMIN";

export type CommentPermission =
  (typeof COMMENT_PERMISSIONS)[keyof typeof COMMENT_PERMISSIONS];
