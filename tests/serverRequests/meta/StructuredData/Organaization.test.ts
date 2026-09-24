// The Organization JSON-LD (serverRequests/meta/StructuredData/Organaization.tsx):
// the company's name, its page for this locale, and its logo.
import { describe, expect, it } from "vitest";

import Organaization from "serverRequests/meta/StructuredData/Organaization";

describe("the Organization JSON-LD", () => {
  it("links the organisation to this locale's page and its logo", () => {
    const element: any = Organaization({ local: "iq-en" });
    const payload = JSON.parse(element.props.dangerouslySetInnerHTML.__html);

    expect(element.props.id, "the script id is wrong").toBe("organization-schema");
    expect(payload.url, "the organisation's page is not this locale's page").toBe("https://trydos.ramaaz.dev/iq-en");
    expect(payload.logo, "the logo address is wrong").toBe("https://trydos.ramaaz.dev/icons/logo.svg");
    expect(payload.alternatename[0], "the locale page is not the first alternate name").toBe(
      "https://trydos.ramaaz.dev/iq-en",
    );
  });
});
