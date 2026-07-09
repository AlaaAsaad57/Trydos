import DOMPurify from "isomorphic-dompurify";

// Central HTML sanitizer for the few places that must render server- or
// seller-controlled HTML via `dangerouslySetInnerHTML` (product/boutique
// descriptions, notification bodies). DOMPurify strips <script>, inline event
// handlers (onerror/onload/…), `javascript:` URLs and other XSS vectors while
// keeping safe rich-text formatting (bold, lists, links, etc.).
//
// isomorphic-dompurify runs the same on the server (jsdom) and the client
// (native DOM), so this helper is safe to call from Server and Client
// Components alike. This is the primary XSS defense — a future CSP is only a
// second layer (see docs/security/csp-decision.md).
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty);
}
