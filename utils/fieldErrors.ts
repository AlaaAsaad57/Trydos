import { translateFunction } from "utils/functions";

/** The backend keys a shopper-facing form can be refused on, and the label the
 *  shopper knows each one by. A key that is not listed here shows its sentence
 *  with no label at all, so a raw backend field name never reaches the screen.
 *
 *  Every label below is a real translation key — it exists in all three of
 *  `public/translations/translations.{ar,tr,ku}.js`. */
const FIELD_LABELS: Record<string, string> = {
  name: "Full Name",
  email: "Email",
  phone: "Phone Number",
  mobile_phone: "Phone Number",
  alternative_phone: "Alternative Phone",
  gender: "Gender",
  weight: "Weight",
  tall: "Height",
};

export interface FieldError {
  /** The backend's own key, for example `email`. */
  field: string;
  /** The backend's own sentences for that key, in the app language. */
  messages: string[];
}

/** Read the field-by-field refusal the backend packs inside `message`.
 *
 *  `/customer/update-profile` answers a refused save with a JSON object written
 *  INTO the message string:
 *
 *      "message": "{\"email\":[\"email already exists\"]}"
 *
 *  Nothing unpacked it, so the shopper was shown that text exactly as it
 *  arrived — braces, quotes and all — and then a second, general line that
 *  named no field at all.
 *
 *  Returns null when the text is not one of these refusals. That is the
 *  caller's signal to keep the message it already had, so an ordinary error is
 *  never rewritten. */
export function parseFieldErrors(message: unknown): FieldError[] | null {
  const raw = typeof message === "string" ? message.trim() : "";
  // A refusal is always a JSON OBJECT. A list carries no field names, so it is
  // not one of these and is left to the caller.
  if (!raw.startsWith("{")) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const out: FieldError[] = [];
  // The keys come from the backend, so they are only ever READ here. Nothing is
  // written into an object under a backend-chosen key.
  for (const field of Object.keys(parsed)) {
    const value = parsed[field];
    const messages = (Array.isArray(value) ? value : [value])
      .filter((text: unknown) => typeof text === "string" && text.trim() !== "")
      .map((text: string) => text.trim());
    if (messages.length > 0) out.push({ field, messages });
  }
  return out.length > 0 ? out : null;
}

/** Build the text the shopper reads: one line per refused field, written as
 *  "<label>: <what the backend said>".
 *
 *  The backend already writes its sentence in the app language, so only the
 *  label is translated here.
 *
 *  Returns null when there is nothing to show — see `parseFieldErrors`. */
export function formatFieldErrors(
  message: unknown,
  language?: string,
): string | null {
  const errors = parseFieldErrors(message);
  if (!errors) return null;

  return errors
    .map(({ field, messages }) => {
      const text = messages.join(" ");
      const label = FIELD_LABELS[field];
      return label ? `${translateFunction(label, language)}: ${text}` : text;
    })
    .join("\n");
}
