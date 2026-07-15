"use strict";

/**
 * Custom ESLint rule: translate-key-exists
 * ----------------------------------------
 * Trydos resolves every user-visible string through `translateFunction(key)` /
 * the per-component `t(key)` alias, where the English string *is* the key and
 * ar/tr/ku are looked up in public/translations/translations.<lang>.js.
 *
 * A missing key fails SILENTLY at runtime (translateFunction returns the raw
 * key), so a typo or an untranslated string is invisible until someone notices
 * English text in an Arabic UI. This rule makes that a build-time error:
 *
 *   - literal key not present in ALL THREE files  -> error (with the exact langs)
 *   - dynamic key (variable / interpolated)       -> not reported by default
 *     (can't be statically resolved; enable `reportDynamic` to surface them)
 *
 * It also enforces the CLAUDE.md "keep the three files key-parallel" rule for
 * every key that is actually used in code.
 */

const fs = require("node:fs");
const path = require("node:path");

const LANGS = ["ar", "tr", "ku"];
const TRANSLATIONS_DIR = path.resolve(
  __dirname,
  "..",
  "public",
  "translations",
);

/**
 * The translation files are ESM (`export default`) inside a CommonJS package,
 * so `require()` can't load them. We read the text and evaluate just the object
 * literal — these are first-party, trusted, dev-time-only files. Robust against
 * comments, trailing commas, and bare-identifier keys (e.g. `Default:`).
 */
function loadKeys(lang) {
  const file = path.join(TRANSLATIONS_DIR, `translations.${lang}.js`);
  const code = fs.readFileSync(file, "utf8");
  const body = code
    .replace(/export\s+default\s+translations\s*;?\s*$/m, "")
    .replace(/^\s*const\s+translations\s*=\s*/m, "return ");
  // eslint-disable-next-line no-new-func
  const dict = new Function(body)();
  return new Set(Object.keys(dict));
}

// Loaded once per lint process, then cached across files.
let keySets = null;
function getKeySets() {
  if (!keySets) {
    keySets = {};
    for (const lang of LANGS) keySets[lang] = loadKeys(lang);
  }
  return keySets;
}

function calleeName(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier" &&
    !callee.computed
  ) {
    return callee.property.name;
  }
  return null;
}

/** Extract a static string key from the first argument, or null if dynamic. */
function staticKey(arg) {
  if (arg.type === "Literal" && typeof arg.value === "string") return arg.value;
  if (arg.type === "TemplateLiteral" && arg.expressions.length === 0) {
    return arg.quasis[0].value.cooked;
  }
  return null;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure i18n keys passed to translateFunction/t exist in all translation files (ar/tr/ku)",
    },
    schema: [
      {
        type: "object",
        properties: {
          callees: { type: "array", items: { type: "string" } },
          reportDynamic: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing:
        'i18n key "{{key}}" is missing from: {{langs}}. Add it (with a real translation) to public/translations/translations.{{langsList}} — keep the three files key-parallel.',
      dynamic:
        "i18n key is not a static string — it can't be verified against the translation files. Translate the static sentence and interpolate the value instead (CLAUDE.md).",
    },
  },

  create(ctx) {
    const opt = ctx.options[0] || {};
    const callees = new Set(opt.callees || ["translateFunction", "t"]);
    const reportDynamic = opt.reportDynamic === true;
    const sets = getKeySets();

    return {
      CallExpression(node) {
        const name = calleeName(node.callee);
        if (!name || !callees.has(name)) return;

        const arg = node.arguments[0];
        if (!arg) return;

        const key = staticKey(arg);
        if (key === null) {
          if (reportDynamic) ctx.report({ node: arg, messageId: "dynamic" });
          return;
        }
        if (key === "") return;

        const missing = LANGS.filter((lang) => !sets[lang].has(key));
        if (missing.length) {
          ctx.report({
            node: arg,
            messageId: "missing",
            data: {
              key,
              langs: missing.join(", "),
              langsList: `{${missing.join(",")}}.js`,
            },
          });
        }
      },
    };
  },
};
