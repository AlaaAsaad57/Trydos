// Turns one picture into the vector that photo search compares with the
// catalogue. Server only: the key must never reach the browser, and Google
// refuses calls from Syria ("User location is not supported", checked
// 2026-11-15), so a browser call would fail for most of our shoppers.
//
// Every setting below MUST match the backend job that wrote the catalogue
// vectors (`color_image_vectors` on the catalogue index). If one differs, our
// vector cannot be compared with theirs and the results are random. That is
// why the model and the size are constants and not env values.

/** The model the backend job uses. Do not change it alone. */
const EMBEDDING_MODEL = "gemini-embedding-2";
/** The vector length the catalogue index stores (`dims: 768`). Without this
 *  field the model answers with 3072 numbers. */
const EMBEDDING_DIMENSIONS = 768;

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

const DEFAULT_TIMEOUT_MS = 15000;
const timeoutMs = () =>
  Number(process.env.IMAGE_SEARCH_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

/** Its own key first, so photo search does not share a quota with the other
 *  AI features. The shared key is only a fallback. */
const apiKey = () =>
  process.env.GEMINI_EMBEDDING_API_KEY || process.env.GEMINI_API_KEY || "";

/** Why the embedding failed. The route turns each kind into an answer. */
type EmbeddingFailure =
  | "no-key" // no key is set on this server
  | "quota" // 429: rate limit or daily quota
  | "invalid-image" // 400 "Provided image is not valid."
  | "refused" // any other answer that is not 200
  | "bad-vector"; // 200, but not 768 numbers

export class EmbeddingError extends Error {
  constructor(
    public kind: EmbeddingFailure,
    message: string,
  ) {
    super(message);
  }
}

/** Divide each number by the vector's length. The model's 768 output was
 *  already unit length in our test (0.99999993), but the backend stores
 *  unit vectors, so this is the safe step either way. */
export function toUnitLength(values: number[]): number[] {
  const length = Math.sqrt(values.reduce((sum, x) => sum + x * x, 0));
  return length === 0 ? values : values.map((x) => x / length);
}

/** One picture in, one unit vector of 768 numbers out. */
export async function embedImage(
  data: Buffer,
  mimeType: string,
): Promise<number[]> {
  const key = apiKey();
  if (!key) throw new EmbeddingError("no-key", "No Gemini key is set");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // The key travels only in the header, never in the URL.
      "x-goog-api-key": key,
    },
    // One part only. Several parts in one call give ONE combined vector.
    // No `task_type`: the model ignores it (same vector with and without).
    body: JSON.stringify({
      content: {
        parts: [
          { inline_data: { mime_type: mimeType, data: data.toString("base64") } },
        ],
      },
      output_dimensionality: EMBEDDING_DIMENSIONS,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs()),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new EmbeddingError("quota", "The embedding model answered 429");
    }
    if (response.status === 400 && /image is not valid/i.test(text)) {
      throw new EmbeddingError("invalid-image", "The model could not read the image");
    }
    throw new EmbeddingError(
      "refused",
      `The embedding model answered ${response.status}: ${text.slice(0, 200)}`,
    );
  }

  const values = (await response.json().catch(() => null))?.embedding?.values;
  if (
    !Array.isArray(values) ||
    values.length !== EMBEDDING_DIMENSIONS ||
    !values.every((x) => typeof x === "number" && Number.isFinite(x))
  ) {
    throw new EmbeddingError(
      "bad-vector",
      `The embedding model sent ${Array.isArray(values) ? values.length : "no"} numbers, not ${EMBEDDING_DIMENSIONS}`,
    );
  }
  return toUnitLength(values);
}
