import { FilterXSS, getDefaultWhiteList } from "xss";

// Central HTML sanitizer for the few places that must render server- or
// seller-controlled HTML via `dangerouslySetInnerHTML` (product/boutique
// descriptions, notification bodies). It strips <script>, inline event
// handlers (onerror/onload/…), `javascript:` URLs and other XSS vectors while
// keeping safe rich-text formatting (bold, lists, links, images, tables, …).
//
// Backed by `xss` (js-xss): a pure-JS, whitelist-based sanitizer that runs
// identically on the server (Node) and the client (browser) WITHOUT a DOM.
// This replaced isomorphic-dompurify, whose jsdom dependency could neither be
// bundled (Turbopack panics on `node:worker_threads`) nor externalized (a
// transitive ESM package crashes `require()` at runtime with ERR_REQUIRE_ESM
// on Vercel). Because `xss` needs no DOM, it sidesteps both failure modes.
// This is the primary XSS defense — the CSP is only a second layer (see
// docs/security/csp-decision.md).

// Start from the library's default tag whitelist and make it DOMPurify-like:
// allow `class` and `style` on every tag (formatting the descriptions rely on),
// and `rel` on links (`target`/`href`/`title` are already allowed). Any `style`
// value is still run through xss's built-in CSS filter, and `on*` handlers /
// unsafe URLs are dropped because they are never whitelisted.
const whiteList = getDefaultWhiteList();
for (const tag of Object.keys(whiteList)) {
  whiteList[tag] = [...(whiteList[tag] ?? []), "class", "style"];
}
whiteList.a = [...(whiteList.a ?? []), "rel"];

const filter = new FilterXSS({
  whiteList,
  // Drop non-whitelisted tags entirely (keep their text) like DOMPurify, rather
  // than leaving them escaped in the output.
  stripIgnoreTag: true,
  // Remove <script>/<style> contents outright instead of escaping the body.
  stripIgnoreTagBody: ["script", "style"],
});

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return filter.process(dirty);
}
