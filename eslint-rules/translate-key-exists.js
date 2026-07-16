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

/**
 * Does `init` (the right-hand side of `const X = …`) resolve to one of the
 * known translate callees? Catches the two aliasing patterns that pervade the
 * codebase and used to slip past this rule silently:
 *
 *   const t = translateFunction;                                // direct
 *   const t = (key) => translateFunction(key, language);        // concise wrapper
 *   const translate = (key, lang) => { return translateFunction(key, lang); };
 *
 * Only the FIRST argument is treated as the key — every wrapper in the tree
 * forwards the key positionally as arg 0 — so an aliased call is verified with
 * the same logic as a direct one.
 */
function initResolvesToCallee(init, isCallee) {
  if (!init) return false;
  // const t = translateFunction;
  if (init.type === "Identifier") return isCallee(init.name);
  // const t = (…) => …  /  const t = function (…) { … }
  if (
    init.type === "ArrowFunctionExpression" ||
    init.type === "FunctionExpression"
  ) {
    const body = init.body;
    // concise arrow body: (key) => translateFunction(key, lang)
    if (body.type === "CallExpression") {
      return isCallee(calleeName(body.callee));
    }
    // block body: look for `return <callee>(…)`
    if (body.type === "BlockStatement") {
      return body.body.some(
        (stmt) =>
          stmt.type === "ReturnStatement" &&
          stmt.argument &&
          stmt.argument.type === "CallExpression" &&
          isCallee(calleeName(stmt.argument.callee)),
      );
    }
  }
  return false;
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
    const baseCallees = new Set(opt.callees || ["translateFunction", "t"]);
    const reportDynamic = opt.reportDynamic === true;
    const sets = getKeySets();

    // Local aliases of a base callee discovered anywhere in this file, e.g.
    // `const translate = (k) => translateFunction(k, lang)`. Collected during
    // traversal; a call may lexically precede its alias' declaration, so we
    // defer the actual verification to Program:exit when the set is complete.
    const aliases = new Set();
    const isCallee = (name) => baseCallees.has(name) || aliases.has(name);
    const calls = []; // { arg, name } for every candidate call

    return {
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          // don't let an alias resolve to itself / another not-yet-seen alias
          initResolvesToCallee(node.init, (n) => baseCallees.has(n))
        ) {
          aliases.add(node.id.name);
        }
      },

      CallExpression(node) {
        const name = calleeName(node.callee);
        if (!name) return;
        const arg = node.arguments[0];
        if (!arg) return;
        calls.push({ arg, name });
      },

      "Program:exit"() {
        for (const { arg, name } of calls) {
          if (!isCallee(name)) continue;

          const key = staticKey(arg);
          if (key === null) {
            if (reportDynamic) ctx.report({ node: arg, messageId: "dynamic" });
            continue;
          }
          if (key === "") continue;

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
        }
      },
    };
  },
};
