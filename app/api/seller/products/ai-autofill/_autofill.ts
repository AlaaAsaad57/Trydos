import { cookies } from "next/headers";
import { HandleAuthedFetch } from "serverRequests/HandleAuthedFetch";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";

// Server-only helpers for POST /api/seller/products/ai-autofill.
//
// The route plays the backend role of the "Fill with AI" guide: it checks the
// seller, loads the photo from OUR media host, loads the brand list and the
// three-level category tree, asks Gemini once, and checks every id it gets back
// against the lists it sent. Nothing here is imported by client code.

const SEP = " -> ";
const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 10_000;
const AI_TIMEOUT_MS = 30_000;
const TITLE_MAX = 255;
const AI_MODEL = "gemini-2.5-flash";
const AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`;

// Message keys the route answers with — the dialog translates them.
export const MESSAGES = {
  forbidden: "You do not have permission for this action.",
  image: "The image must be uploaded to the media server",
  tooMany: "Too many requests. Please try again in a moment.",
  busy: "The AI service is busy right now. Please try again in a moment.",
  failed: "AI analysis failed",
} as const;

export const CREATE_PRODUCT = "CREATE_PRODUCT";
export const SUPER_ADMIN = "SUPER_ADMIN";

export class AiBusyError extends Error {}
export class AiFailedError extends Error {}

export type AccessResult = { ok: boolean; status: 200 | 401 | 403 };

export interface NamedItem {
  id: number;
  name: string;
}
export interface PathItem {
  id: number;
  path: string;
}
export interface ChildItem extends PathItem {
  parentId: number;
}
export interface AutofillLists {
  brands: NamedItem[];
  categories: PathItem[];
  subCategories: ChildItem[];
  subSubCategories: ChildItem[];
}
export interface AutofillImage {
  mimeType: string;
  base64: string;
}
export interface AutofillSuggestion {
  title: string | null;
  description: string | null;
  brand_id: number | null;
  category_id: number | null;
  sub_category_id: number | null;
  sub_sub_category_id: number | null;
}

const backend = (path: string) => (process.env.BACKEND_URL || "") + path;

const isOk = (res: any) =>
  !!res && !res.isError && res.status >= 200 && res.status < 300;

/** The answer body is `{ data: [...] }`; tolerate a bare array too. */
const listOf = (body: any, key?: string): any[] => {
  const root = key ? body?.data?.[key] ?? body?.[key] : body?.data ?? body;
  return Array.isArray(root) ? root : [];
};

/* ------------------------------------------------------------------------- */
/* Access                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * The signed-in user must be a member of `sellerId` and hold CREATE_PRODUCT or
 * SUPER_ADMIN there, as the core backend reports it. The client's sellerId is
 * only ever used to pick a shop out of that answer.
 *
 * No market cookie at all → 401 at once. Calling HandleAuthedFetch without one
 * would register a new guest for an anonymous caller, for nothing.
 */
export async function assertProductCreateAccess(
  sellerId: string,
): Promise<AccessResult> {
  const store = await cookies();
  if (!store.get(COOKIE_NAMES.MARKET_TOKEN)?.value) {
    return { ok: false, status: 401 };
  }

  const res = await HandleAuthedFetch({
    url: backend("/shop/auth/permissions"),
    method: "GET",
  });
  if (res?.status === 403) return { ok: false, status: 403 };
  if (!isOk(res)) return { ok: false, status: 401 };

  const shop = listOf(res.data).find(
    (s: any) => String(s?.seller_id) === sellerId,
  );
  if (!shop) return { ok: false, status: 403 };

  const permissions: string[] = Array.isArray(shop.permissions)
    ? shop.permissions
    : [];
  if (!permissions.includes(CREATE_PRODUCT) && !permissions.includes(SUPER_ADMIN)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, status: 200 };
}

/* ------------------------------------------------------------------------- */
/* Image                                                                     */
/* ------------------------------------------------------------------------- */

const IMAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp)$/i;

/** Only a bare stored file name is accepted — never a URL or a path, so the
 *  route builds the address itself and cannot be pointed at another host. */
export function parseImageName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return IMAGE_NAME.test(name) ? name : null;
}

/** Download `/product/<name>` from our media host. `null` when the host does
 *  not serve it as an image of a usable size. */
export async function loadImage(name: string): Promise<AutofillImage | null> {
  const base = (process.env.NEXT_PUBLIC_BASE_MEDIA_URL || "").replace(/\/$/, "");
  if (!base) return null;
  try {
    const res = await fetch(`${base}/product/${name}`, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (res.status !== 200) return null;
    const mimeType = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (!mimeType.startsWith("image/")) return null;
    if (Number(res.headers.get("content-length") || 0) > MAX_IMAGE_BYTES) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
    return { mimeType, base64: bytes.toString("base64") };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------- */
/* Lists                                                                     */
/* ------------------------------------------------------------------------- */

type RawCategory = { id: number; display_name: string; level?: number };

/**
 * Turn the categories-with-levels answer into the three lists.
 *
 * The level is the PATH DEPTH of `display_name` (number of " -> "), never the
 * `level` field: on staging (2026-10-19) `level` was 0 for 302 of 471 items
 * that are really one or two levels deep, while every path was consistent.
 *
 * A child's parent is the item whose path is the child's path without its last
 * segment. If no such item exists, the nearest earlier item one level up is
 * used (the answer is a tree "in display order"). An item neither rule links,
 * or deeper than two, is dropped. Anything unusual is reported once.
 */
export function buildCategoryLists(
  raw: any[],
  parentCategoryIds: Set<number>,
  sellerId: string,
): Pick<AutofillLists, "categories" | "subCategories" | "subSubCategories"> {
  const items: (RawCategory & { depth: number })[] = raw
    .filter((c) => Number.isInteger(Number(c?.id)) && typeof c?.display_name === "string")
    .map((c) => ({
      id: Number(c.id),
      display_name: c.display_name.trim(),
      level: c.level,
      depth: c.display_name.trim().split(SEP).length - 1,
    }));

  const byPath = new Map<string, (typeof items)[number]>();
  for (const it of items) if (!byPath.has(it.display_name)) byPath.set(it.display_name, it);

  const categories: PathItem[] = [];
  const subCategories: ChildItem[] = [];
  const subSubCategories: ChildItem[] = [];
  const levelCounts: Record<string, number> = {};
  let linkedByPath = 0;
  let linkedByOrder = 0;
  let dropped = 0;
  let levelMismatch = 0;

  items.forEach((it, index) => {
    levelCounts[it.depth] = (levelCounts[it.depth] || 0) + 1;
    if (it.level !== undefined && Number(it.level) !== it.depth) levelMismatch++;

    if (it.depth === 0) {
      if (parentCategoryIds.has(it.id)) categories.push({ id: it.id, path: it.display_name });
      return;
    }
    if (it.depth > 2) {
      dropped++;
      return;
    }

    let parent = byPath.get(it.display_name.split(SEP).slice(0, -1).join(SEP));
    if (parent && parent.depth === it.depth - 1) {
      linkedByPath++;
    } else {
      parent = undefined;
      for (let k = index - 1; k >= 0; k--) {
        if (items[k].depth === it.depth - 1) {
          parent = items[k];
          break;
        }
      }
      if (!parent) {
        dropped++;
        return;
      }
      linkedByOrder++;
    }

    const child = { id: it.id, path: it.display_name, parentId: parent.id };
    (it.depth === 1 ? subCategories : subSubCategories).push(child);
  });

  if (dropped || linkedByOrder || levelMismatch) {
    LogServerError({
      scenario: "seller-ai-autofill: category tree",
      levelCounts,
      linkedByPath,
      linkedByOrder,
      dropped,
      levelMismatch,
      sellerId,
    });
  }

  return { categories, subCategories, subSubCategories };
}

/** Brands from the product lookups + the category tree from the Excel lookup.
 *  Both are read with the seller header and English names. Throws on failure. */
export async function loadLists(sellerId: string): Promise<AutofillLists> {
  const headers = { "X-Seller-ID": sellerId, lang: "en" };
  const [lookups, tree] = await Promise.all([
    HandleAuthedFetch({ url: backend("/shop/products/lookups"), method: "GET", headers }),
    HandleAuthedFetch({ url: backend("/shop/excel/categories"), method: "GET", headers }),
  ]);
  if (!isOk(lookups)) throw new AiFailedError(`lookups ${lookups?.status ?? 0}`);
  if (!isOk(tree)) throw new AiFailedError(`categories ${tree?.status ?? 0}`);

  const brands: NamedItem[] = listOf(lookups.data, "brands")
    .filter((b: any) => Number.isInteger(Number(b?.id)) && b?.name)
    .map((b: any) => ({ id: Number(b.id), name: String(b.name) }));
  const parentIds = new Set<number>(
    listOf(lookups.data, "parent_categories").map((c: any) => Number(c?.id)),
  );

  return { brands, ...buildCategoryLists(listOf(tree.data), parentIds, sellerId) };
}

/* ------------------------------------------------------------------------- */
/* AI call                                                                   */
/* ------------------------------------------------------------------------- */

export const INSTRUCTIONS = [
  "You help a seller add a product to an online shop. Look at the product photo.",
  "Write a short, marketable product title of at most 100 characters.",
  "Write a short, factual description of 2 to 4 sentences.",
  "Always write in English, whatever text appears in the photo.",
  "Describe only what is visible. Never invent sizes, materials, specifications or prices.",
  "Choose the brand and the categories ONLY from the lists below, by id.",
  "The sub-category must be under the chosen category, and the sub-sub-category under the chosen sub-category.",
  "Return null for any field you cannot match with confidence. Do not guess.",
].join("\n");

const lines = (items: { id: number; name?: string; path?: string }[]) =>
  items.length ? items.map((i) => `${i.id}: ${i.path ?? i.name}`).join("\n") : "(none)";

const nullable = (type: "STRING" | "INTEGER") => ({ type, nullable: true });

export function buildGeminiRequest(image: AutofillImage, lists: AutofillLists) {
  const text = [
    INSTRUCTIONS,
    `\nBRANDS (id: name)\n${lines(lists.brands)}`,
    `\nCATEGORIES (id: path)\n${lines(lists.categories)}`,
    `\nSUB-CATEGORIES (id: path)\n${lines(lists.subCategories)}`,
    `\nSUB-SUB-CATEGORIES (id: path)\n${lines(lists.subSubCategories)}`,
  ].join("\n");

  return {
    contents: [
      {
        role: "user",
        parts: [
          { inline_data: { mime_type: image.mimeType, data: image.base64 } },
          { text },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: nullable("STRING"),
          description: nullable("STRING"),
          brand_id: nullable("INTEGER"),
          category_id: nullable("INTEGER"),
          sub_category_id: nullable("INTEGER"),
          sub_sub_category_id: nullable("INTEGER"),
        },
        required: [
          "title",
          "description",
          "brand_id",
          "category_id",
          "sub_category_id",
          "sub_sub_category_id",
        ],
      },
      // Thinking tokens are billed and add seconds; this task does not need them.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
}

/** One Gemini call. The key travels only in the header, never in the URL. */
export async function callGemini(body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY || "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
  } catch {
    throw new AiFailedError("ai unreachable or timed out");
  }
  if (res.status === 503 || res.status === 429) throw new AiBusyError(`ai ${res.status}`);
  if (!res.ok) throw new AiFailedError(`ai ${res.status}`);

  try {
    const data: any = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(String(text));
  } catch {
    throw new AiFailedError("ai answer unreadable");
  }
}

/* ------------------------------------------------------------------------- */
/* Answer check                                                              */
/* ------------------------------------------------------------------------- */

const toId = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) ? n : null;
};

const toText = (v: unknown, max?: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return max ? t.slice(0, max) : t;
};

/** Every id must be one we sent, and the three levels must fit together. */
export function checkSuggestion(raw: any, lists: AutofillLists): AutofillSuggestion {
  const brandIds = new Set(lists.brands.map((b) => b.id));
  const categoryIds = new Set(lists.categories.map((c) => c.id));
  const subParent = new Map(lists.subCategories.map((c) => [c.id, c.parentId]));
  const subSubParent = new Map(lists.subSubCategories.map((c) => [c.id, c.parentId]));

  const brand = toId(raw?.brand_id);
  const category = toId(raw?.category_id);
  const sub = toId(raw?.sub_category_id);
  const subSub = toId(raw?.sub_sub_category_id);

  const category_id = category !== null && categoryIds.has(category) ? category : null;
  const sub_category_id =
    category_id !== null && sub !== null && subParent.get(sub) === category_id ? sub : null;
  const sub_sub_category_id =
    sub_category_id !== null && subSub !== null && subSubParent.get(subSub) === sub_category_id
      ? subSub
      : null;

  return {
    title: toText(raw?.title, TITLE_MAX),
    description: toText(raw?.description),
    brand_id: brand !== null && brandIds.has(brand) ? brand : null,
    category_id,
    sub_category_id,
    sub_sub_category_id,
  };
}
