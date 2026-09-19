// @vitest-environment node
//
// The boutique reader, and the QA lock inside it (AC-3).
//
// This file exists because of one gap. The catalogue base query is written out
// **six times** in this repository, and `ElasticsearchReader` owns two of them.
// The clause that hides QA shops had to go into each copy separately, so each
// copy needs its own proof — a test of `helpers.ts` says nothing about this
// class.
//
// The boutique path is the one this file owns. It is the query behind the home
// page's shop row and the shops listing, and it is the one place a QA **shop**
// would appear as itself rather than through one of its products.
//
// **The filter here is unconditional — there is no QA-mode switch.** That is
// deliberate and it is worth knowing before reading the cases: no test needs to
// see the QA shop in a boutique list. The seed reads its shop back through the
// seller dashboard, and the sync poll asks the product search, which does have
// a switch. So there is no case here for "QA mode shows it", because there is
// no such behaviour to test.

import { beforeEach, describe, expect, it, vi } from "vitest";

const search = vi.fn();

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    search: (...args: unknown[]) => search(...args),
    indices: { exists: vi.fn(), stats: vi.fn() },
    count: vi.fn(),
  },
  elasticSearchComment: {},
}));

// The reader reports its own failures. Stood in so a broken case fails as
// itself rather than as a network call to the error backend.
const LogServerError = vi.fn(async () => undefined);
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: unknown[]) => LogServerError(...(args as [])),
  default: (...args: unknown[]) => LogServerError(...(args as [])),
}));

import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";

/** An answer with one boutique bucket, so the flow completes rather than
 *  falling into its catch. A query check against a flow that threw would be
 *  reading a query the app never meant to send. */
const oneBoutique = {
  aggregations: {
    boutiques_composite: {
      after_key: null,
      buckets: [
        {
          key: { boutique_position: 1, boutique_id: 42 },
          doc_count: 3,
          boutique_data: {
            hits: {
              hits: [
                {
                  _source: {
                    boutique_id: 42,
                    custom_boutiques: [
                      {
                        id: 7,
                        boutique_id: 42,
                        language_code: "en",
                        name: "A real shop",
                        slug: "a-real-shop",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
    },
  },
  hits: { hits: [] },
};

/** Every QA clause anywhere inside a query. Walks the whole object, because the
 *  reader nests its query one level deeper than the other builders do. */
const qaClausesIn = (node: unknown): any[] => {
  const found: any[] = [];
  const walk = (value: any): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (
      value?.nested?.path === "custom_boutiques" &&
      value?.nested?.query?.prefix
    ) {
      found.push(value);
    }
    Object.values(value).forEach(walk);
  };
  walk(node);
  return found;
};

beforeEach(() => {
  vi.clearAllMocks();
  search.mockResolvedValue(oneBoutique);
});

describe("boutique rows hide the QA shop", () => {
  it("excludes QA shops from the boutique list", async () => {
    const reader = new ElasticsearchReader();

    const result = await reader.getBoutiques({ language: "en", limit: 10 });

    // A real shop came back, so an empty answer cannot make the query check
    // below pass for the wrong reason.
    expect(
      result?.boutiques?.length,
      "the boutique reader answered with no shops, so it fell into its catch and the query checked below is not the one the app sends",
    ).toBeGreaterThan(0);

    const sent = search.mock.calls[0]?.[0];
    const clauses = qaClausesIn(sent);

    expect(
      clauses.length,
      "the boutique query carried no clause excluding QA shops, so the shop the e2e suite creates would appear in the home page's shop row",
    ).toBeGreaterThan(0);

    expect(
      clauses[0].nested.query.prefix["custom_boutiques.slug.keyword"].value,
      "the boutique query excludes shops by a prefix that is not the QA mark, so it would hide the wrong shops or none",
    ).toBe("trydos-qa-");
  });

  it("puts the clause in must_not, not in must", async () => {
    // A clause in the wrong half inverts the whole rule: the boutique list
    // would show the QA shop and nothing else.
    const reader = new ElasticsearchReader();
    await reader.getBoutiques({ language: "en", limit: 10 });

    const sent: any = search.mock.calls[0]?.[0];
    const bool = sent?.body?.query?.bool ?? sent?.query?.bool;

    expect(
      qaClausesIn(bool?.must_not).length,
      "the QA clause is not in the query's must_not half",
    ).toBeGreaterThan(0);
    expect(
      qaClausesIn(bool?.must).length,
      "the QA clause landed in the query's must half, which shows ONLY QA shops to every customer",
    ).toBe(0);
  });

  it("excludes QA shops from a single boutique's own page data", async () => {
    // `getBoutiqueInfo` reads through the same builder. It is a second caller,
    // so it needs its own check: a shopper reaching a QA shop's page by address
    // is a different path from a shopper browsing to it.
    const reader = new ElasticsearchReader();

    await reader.getBoutiqueInfo({
      language: "en",
      country: "sy",
      slug: "a-real-shop",
    } as any);

    const sent = search.mock.calls[0]?.[0];
    expect(
      qaClausesIn(sent).length,
      "the single-boutique query carried no clause excluding QA shops",
    ).toBeGreaterThan(0);
  });
});
