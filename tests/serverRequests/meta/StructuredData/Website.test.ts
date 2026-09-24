// The site-wide WebSite JSON-LD (serverRequests/meta/StructuredData/Website.tsx):
// the site's language for the page, and the search box template Google uses
// to deep-link into /{locale}/filters?search=.
import { describe, expect, it } from "vitest";

import Website from "serverRequests/meta/StructuredData/Website";

describe("the WebSite JSON-LD", () => {
  it("names the page's language and the search results address", () => {
    const element: any = Website({ local: "sy-ar" });
    const payload = JSON.parse(element.props.dangerouslySetInnerHTML.__html);

    expect(element.props.id, "the script id is wrong").toBe("website-schema");
    expect(payload.inLanguage, "the page's language is wrong").toBe("ar-SY");
    expect(payload.potentialAction.target.urlTemplate, "the search template is wrong").toBe(
      "https://trydos.ramaaz.dev/sy-ar/filters?search={search_term_string}",
    );
  });
});
