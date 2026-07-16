# Rich-text Descriptions + Sanitize Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the boutique & product description textareas with a small TipTap rich-text editor (Bold/Italic/Underline/H2) and sanitize every description on save so no dangerous markup reaches the backend.

**Architecture:** One shared client component `RichTextEditor` (TipTap) is dropped into the two primary description fields. On save, the existing `xss`-backed `sanitizeHtml` is applied at all four description payload points (boutique global + per-lang, product main + per-lang). Render-time sanitize already exists and is unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TailwindCSS 4, TipTap 3 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-underline`), existing `utils/sanitizeHtml.ts` (`xss`).

## Global Constraints

- Package manager is **pnpm** (`pnpm add …`, never npm/yarn).
- **No test suite** — verification is `pnpm lint` + `pnpm build` (type-check) + manual QA. Do **not** add test files.
- **i18n mandatory:** every new user-visible string (`Bold`, `Italic`, `Underline`, `Heading`) must be added to all three of `public/translations/translations.{ar,tr,ku}.js` **before** use, and resolved via `translateFunction`. Keys are the exact English strings.
- **Commits:** this repo commits **only when the user asks**. Treat the "Commit" steps as checkpoints — run them only if the user has authorized committing; otherwise stop at the verify step. Work happens on the current `develop` branch (or a ticket branch off `develop`); never touch `main`.
- Path aliases: `components/*`, `utils/*` resolve from repo root.
- React Compiler is on — no manual `useMemo`/`useCallback`.

---

### Task 1: Install TipTap and add toolbar translations

**Files:**
- Modify: `package.json` / `pnpm-lock.yaml` (via `pnpm add`)
- Modify: `public/translations/translations.ar.js`
- Modify: `public/translations/translations.tr.js`
- Modify: `public/translations/translations.ku.js`

**Interfaces:**
- Produces: the `@tiptap/*` packages and translation keys `"Bold"`, `"Italic"`, `"Underline"`, `"Heading"` that Task 2 consumes.

- [ ] **Step 1: Install TipTap packages**

Run:
```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline
```
Expected: packages added to `dependencies`; `pnpm-lock.yaml` updated; no peer-dependency errors against React 19.

- [ ] **Step 2: Add the four toolbar keys to `translations.ar.js`**

Insert these lines just after the opening `const translations = {` line (top of the object) in `public/translations/translations.ar.js`:
```js
  "Bold": "عريض",
  "Italic": "مائل",
  "Underline": "تسطير",
  "Heading": "عنوان",
```

- [ ] **Step 3: Add the same keys to `translations.tr.js`**

Insert just after `const translations = {` in `public/translations/translations.tr.js`:
```js
  "Bold": "Kalın",
  "Italic": "İtalik",
  "Underline": "Altı çizili",
  "Heading": "Başlık",
```

- [ ] **Step 4: Add the same keys to `translations.ku.js`**

Insert just after `const translations = {` in `public/translations/translations.ku.js`:
```js
  "Bold": "Stûr",
  "Italic": "Xwar",
  "Underline": "Binxêz",
  "Heading": "Sernav",
```

- [ ] **Step 5: Verify the keys parse and exist in all three files**

Run:
```bash
grep -nE '"(Bold|Italic|Underline|Heading)":' public/translations/translations.ar.js public/translations/translations.tr.js public/translations/translations.ku.js
```
Expected: 4 matches per file (12 total). No duplicate-key lint later.

- [ ] **Step 6: Commit** (only if the user authorized committing)

```bash
git add package.json pnpm-lock.yaml public/translations/translations.ar.js public/translations/translations.tr.js public/translations/translations.ku.js
git commit -m "chore(seller-dashboard): add TipTap deps and rich-text toolbar translations"
```

---

### Task 2: Build the shared `RichTextEditor` component

**Files:**
- Create: `components/SellerDashboard/ui/RichTextEditor.tsx`

**Interfaces:**
- Consumes: `translateFunction` (`utils/functions`), `dashInputClass` (`components/SellerDashboard/ui`), TipTap packages + translation keys from Task 1.
- Produces:
  ```ts
  export function RichTextEditor(props: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    error?: string;
  }): JSX.Element
  ```
  Emits `""` when the editor is empty (so `.trim()` "required" checks still fire); otherwise emits `editor.getHTML()`. Tasks 3 and 4 consume this signature.

- [ ] **Step 1: Create the component file**

Create `components/SellerDashboard/ui/RichTextEditor.tsx` with exactly:
```tsx
"use client";
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { translateFunction } from "utils/functions";
import { dashInputClass } from "components/SellerDashboard/ui";

const t = (s: string) => translateFunction(s);

/**
 * Minimal seller-dashboard rich-text editor: Bold / Italic / Underline / H2.
 * Drop-in for the old <textarea>/<Area> (same value/onChange/disabled/error API).
 * Emits "" when empty so existing `.trim()` "required" validation keeps working.
 * The saved HTML is sanitized at the save chokepoints (see helpers.ts), and the
 * storefront sanitizes again on render — defense in depth.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const editor = useEditor({
    // Next.js SSR: never render on the server (avoids hydration mismatch).
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        // StarterKit v3 bundles these; disable so our explicit extension / gate wins.
        underline: false,
        link: false,
      }),
      Underline,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Sync external value changes (data load, boutique "Copy from") without
  // stomping the caret while the user is typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `w-8 h-8 rounded-md text-[13px] flex items-center justify-center transition-colors disabled:opacity-50 ${
      active
        ? "bg-[#5d5d5d] text-white"
        : "bg-[#f2f2f2] text-[#5d5d5d] hover:bg-[#e6e6e6]"
    }`;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <button
          type="button"
          disabled={disabled}
          title={t("Bold")}
          aria-label={t("Bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          disabled={disabled}
          title={t("Italic")}
          aria-label={t("Italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          disabled={disabled}
          title={t("Underline")}
          aria-label={t("Underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          disabled={disabled}
          title={t("Heading")}
          aria-label={t("Heading")}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive("heading", { level: 2 }))}
        >
          H2
        </button>
      </div>
      <EditorContent
        editor={editor}
        className={`${dashInputClass} h-auto py-3 leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px] [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:my-1 [&_strong]:font-bold [&_u]:underline ${
          error ? "border-[#f85555]" : ""
        } ${disabled ? "opacity-70" : ""}`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check the component**

Run:
```bash
pnpm build
```
Expected: build compiles; no TS error about missing `@tiptap/*` types, `immediatelyRender`, or `toggleUnderline`. (If `toggleUnderline` is unresolved, confirm `@tiptap/extension-underline` installed in Task 1.)

- [ ] **Step 3: Lint**

Run:
```bash
pnpm lint
```
Expected: no new errors in `RichTextEditor.tsx`.

- [ ] **Step 4: Commit** (only if the user authorized committing)

```bash
git add components/SellerDashboard/ui/RichTextEditor.tsx
git commit -m "feat(seller-dashboard): add shared TipTap RichTextEditor (B/I/U/H2)"
```

---

### Task 3: Wire boutique description to the editor + sanitize gate

**Files:**
- Modify: `components/SellerDashboard/boutiqueEdit/sections.tsx` (import + the description `<textarea>` at ~line 234)
- Modify: `components/SellerDashboard/boutiqueEdit/helpers.ts` (import + payload at ~lines 266 and 293)

**Interfaces:**
- Consumes: `RichTextEditor` (Task 2), `sanitizeHtml` (`utils/sanitizeHtml`).
- Produces: boutique description edited as rich text; `boutique_global_data.description` and each `custom_data[].description` sanitized before send.

- [ ] **Step 1: Import `RichTextEditor` in `boutiqueEdit/sections.tsx`**

Add to the `components/SellerDashboard/ui` import (currently `{ DashButton, DashIcon, Segmented }` at line 6):
```tsx
import { DashButton, DashIcon, Segmented } from "components/SellerDashboard/ui";
import { RichTextEditor } from "components/SellerDashboard/ui/RichTextEditor";
```

- [ ] **Step 2: Replace the description textarea**

In `boutiqueEdit/sections.tsx`, replace the whole `<textarea …/>` inside the Description `FieldShell` (lines ~234-244):
```tsx
          <textarea
            rows={4}
            value={tr.description}
            disabled={disabled}
            onChange={(e) =>
              patchTranslation(activeLang, { description: e.target.value })
            }
            className={`${dashInputClass} h-auto py-3 leading-relaxed ${
              descriptionError ? "border-[#f85555]" : ""
            } ${disabled ? "opacity-70" : ""}`}
          />
```
with:
```tsx
          <RichTextEditor
            value={tr.description}
            disabled={disabled}
            error={descriptionError}
            onChange={(v) => patchTranslation(activeLang, { description: v })}
          />
```
(The surrounding `FieldShell` still renders the label, the "Copy from" action, and the error message — unchanged.)

- [ ] **Step 3: Import `sanitizeHtml` in `boutiqueEdit/helpers.ts`**

Add at the top of `boutiqueEdit/helpers.ts` (after the header comment, before `export type LangCode`):
```ts
import { sanitizeHtml } from "utils/sanitizeHtml";
```

- [ ] **Step 4: Sanitize the per-language description in the payload**

In `boutiqueEdit/helpers.ts`, in the `custom_data` map (~line 266) change:
```ts
        description: tr.description,
```
to:
```ts
        description: sanitizeHtml(tr.description),
```

- [ ] **Step 5: Sanitize the global description in the payload**

In the same file, in the `boutique_global_data` object (~line 293) change:
```ts
      description: base.description,
```
to:
```ts
      description: sanitizeHtml(base.description),
```

- [ ] **Step 6: Type-check and lint**

Run:
```bash
pnpm build && pnpm lint
```
Expected: compiles; no unused-import or type errors in the two files.

- [ ] **Step 7: Manual QA**

Open a boutique in the seller dashboard (`/sellerProfile/sellerDashboard/[sellerId]/boutiques/[boutiqueId]`):
1. The description field shows the B/I/U/H2 toolbar and loads existing content.
2. Bold/Italic/Underline/H2 toggle and persist after Save.
3. Clearing all text still triggers the "Description is required" error (empty → `""`).
4. Paste `<img src=x onerror=alert(1)>hello` then Save; inspect the network payload — `description` contains `hello` with the `onerror` handler stripped, and the storefront renders no alert.

- [ ] **Step 8: Commit** (only if the user authorized committing)

```bash
git add components/SellerDashboard/boutiqueEdit/sections.tsx components/SellerDashboard/boutiqueEdit/helpers.ts
git commit -m "feat(seller-dashboard): rich-text boutique description with save-time sanitize"
```

---

### Task 4: Wire product description to the editor + sanitize gate

**Files:**
- Modify: `components/SellerDashboard/productEdit/sections.tsx` (import + main description `Area` at ~line 298)
- Modify: `components/SellerDashboard/productEdit/helpers.ts` (import + `set("description")` at ~line 631 and `custom_data[i][description]` at ~line 708)

**Interfaces:**
- Consumes: `RichTextEditor` (Task 2), `DashField` (already imported in the file), `sanitizeHtml` (`utils/sanitizeHtml`).
- Produces: main product description edited as rich text; both `description` and per-language `custom_data[i][description]` sanitized before send.

- [ ] **Step 1: Import `RichTextEditor` in `productEdit/sections.tsx`**

Add below the existing `components/SellerDashboard/ui` import block (ends line 11):
```tsx
import { RichTextEditor } from "components/SellerDashboard/ui/RichTextEditor";
```
(`DashField` and `t` are already in scope in this file.)

- [ ] **Step 2: Replace the main description `Area` with a labelled `RichTextEditor`**

In `productEdit/sections.tsx`, replace the description block (line ~297-299):
```tsx
      <div className="mt-5">
        <Area label="Description" value={form.description} disabled={disabled} onChange={(v) => patch({ description: v })} rows={5} />
      </div>
```
with:
```tsx
      <div className="mt-5">
        <DashField label={t("Description")}>
          <RichTextEditor value={form.description} disabled={disabled} onChange={(v) => patch({ description: v })} />
        </DashField>
      </div>
```
(Leave the local `Area` component defined — it may be used elsewhere; only this call site changes. The per-language `Txt` description inputs in `TranslationsSection` stay single-line.)

- [ ] **Step 3: Import `sanitizeHtml` in `productEdit/helpers.ts`**

Add after the top doc-comment block (before the first `import`/code) in `productEdit/helpers.ts`:
```ts
import { sanitizeHtml } from "utils/sanitizeHtml";
```

- [ ] **Step 4: Sanitize the main description on save**

In `productEdit/helpers.ts` `buildUpdateFormData` (~line 631) change:
```ts
  set("description", form.description);
```
to:
```ts
  set("description", sanitizeHtml(form.description));
```

- [ ] **Step 5: Sanitize the per-language description on save**

In the `form.translations.forEach` block (~line 708) change:
```ts
    fd.append(`custom_data[${i}][description]`, t.description || "");
```
to:
```ts
    fd.append(`custom_data[${i}][description]`, sanitizeHtml(t.description || ""));
```
(Note: `t` here is the translation row, not the translate function — do not confuse them.)

- [ ] **Step 6: Type-check and lint**

Run:
```bash
pnpm build && pnpm lint
```
Expected: compiles; no unused `Area` warning that breaks the build (ESLint here is permissive), no type errors.

- [ ] **Step 7: Manual QA**

Open a product editor (`/sellerProfile/sellerDashboard/[sellerId]/products/[productId]`):
1. The main Description field shows the B/I/U/H2 toolbar and loads existing content.
2. Formatting toggles and persists after Save.
3. Paste a `<script>alert(1)</script>` payload into the description then Save; inspect the multipart payload — the `description` field has the script stripped; the product detail page renders no script.

- [ ] **Step 8: Commit** (only if the user authorized committing)

```bash
git add components/SellerDashboard/productEdit/sections.tsx components/SellerDashboard/productEdit/helpers.ts
git commit -m "feat(seller-dashboard): rich-text product description with save-time sanitize"
```

---

## Notes on TipTap version behavior

- StarterKit v3 bundles `Underline` and `Link`; the config disables both, and we register `@tiptap/extension-underline` explicitly so `toggleUnderline()` is available regardless of minor version. If `pnpm add` resolves StarterKit v2 (no bundled underline), the `underline:false`/`link:false` keys are simply ignored — the explicit `Underline` extension still provides the mark. Either way the component compiles and behaves identically.
- `@tiptap/pm` is installed as a direct dependency per TipTap guidance (it is the ProseMirror peer used by `@tiptap/react`).
