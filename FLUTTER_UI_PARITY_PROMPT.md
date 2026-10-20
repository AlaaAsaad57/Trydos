# Task: make a Flutter widget look identical to the web

You are Claude, working inside the Flutter app's repository. Your task is to
make one piece of the app's UI look exactly like the same element on our
website. The website is the source of truth for the look. Every visual
difference between the app and the web counts as a bug.

**Make the changes yourself.** Use your tools to read files, edit the Dart code,
and create new files when needed. Do not only suggest changes, and do not stop
to ask for approval of a plan. Start the work as soon as you have read this
prompt and the HTML file.

## About the website

The website is built with **Next.js and Tailwind CSS v4**. Almost all of its
styles live in Tailwind class names on the HTML elements, not in separate CSS
files. So you read the design by resolving each Tailwind class into an exact
value. The rules for that are in "How to read the HTML" below.

## Input in this chat

Beside this prompt, the chat contains:
1. **An HTML file**, copied from Chrome DevTools (Copy → Copy outerHTML). It is
   the web version of the UI. It may be attached, pasted, or referenced by path.
2. **Often: the Flutter file** that shows the same UI in the app.
3. **Sometimes:** a screenshot of the web, or values from the DevTools
   "Computed" tab. Values from the Computed tab are exact. Prefer them over your
   own conversion.

If the chat does not name the Flutter file, find it yourself. Search the project
for the widget by its visible text, its translation keys, its icons, and its
screen or class names.
- If you find it, edit it.
- If nothing matches, build a new widget in the folder where similar widgets
  live, following the project's file and naming style.
- Ask the developer only when two or more files are equally likely to be the
  right one.

## Scope: the look only, never the behaviour

This task changes how the UI **looks**. The behaviour already works and is
tested, so a change to it can break a working flow without anyone noticing.

Leave these exactly as they are:
- state management (Bloc / Cubit / Provider / Riverpod / setState logic)
- API calls, repositories, models, validation, navigation, routes
- callbacks and event handlers, what a button does, when a widget shows or hides
- translation keys and text content. The HTML text is in whatever language the
  web page had open, so keep the app's existing localized strings.
- public widget constructors and parameters that other files use

You may change: the layout widget tree, padding, margin, sizes, colors, fonts,
borders, radius, shadows, icons, alignment, and animations.

Keep every existing `onTap` / `onChanged` / controller attached to the same
visible element after your change.

If one visual detail needs new state or new logic, skip that one detail. Finish
everything else, and list the skipped detail in your report with the reason.

When you **build a new widget**, take the texts, values and callbacks as
constructor parameters. Do not add API calls or state management to it. Put a
`// TODO(ui-parity): connect <what>` comment where logic must be wired later.

Keep the change small:
- Do not refactor code that is not part of this UI.
- Do not add new abstractions or helper layers.
- Do not add a new package. If a package is needed (for example `flutter_svg`
  for an inline SVG) and it is not in `pubspec.yaml`, report it.
- Do not change the shared theme. If a theme value differs from the web, use the
  exact web value in this widget and report the difference.

## What "identical" means: match every UI value

Match all of these, for every element in the HTML, from the outermost node down
to the smallest icon:
- **Layout:** direction (row / column), order of children, alignment on both
  axes, gaps, wrapping, which child grows (`flex-1`) and which does not
  (`shrink-0`)
- **Size:** width, height, min / max width and height, aspect ratio
- **Spacing:** padding and margin on every side, gap between children
- **Typography:** font family, font size, font weight, line height, letter
  spacing, text color, text alignment, text transform, max lines, ellipsis,
  underline
- **Color:** background, text, border, icon, overlay, backdrop, opacity. Use the
  exact hex and alpha.
- **Borders:** width, color, style, radius per corner, which sides have a border
- **Shadows:** x, y, blur, spread, color and alpha
- **Icons and images:** which icon (use the SVG path when the HTML has an inline
  SVG), size, color, fit (cover / contain), radius
- **States:** selected, checked, disabled, pressed, focused, error, loading,
  empty. Build every state the HTML shows. For a state the HTML does not show,
  keep the app's current look and list it in the report as "need the web HTML
  for this state".
- **Animation:** transition duration and curve

## How to read the HTML (Tailwind CSS v4)

1. **Units.** 1rem = 16px. The Tailwind spacing unit is 4px (`p-1` = 4px,
   `p-3` = 12px, `gap-2.5` = 10px). Arbitrary values are literal:
   `text-[13px]` = 13px, `w-[calc(100%-16px)]` = full width minus 16px.
   One CSS px = one Flutter logical pixel. If the Flutter project already uses a
   size helper (for example ScreenUtil `.w` / `.h` / `.sp`), use it the same way
   the rest of the project does.

2. **Breakpoints are inverted in this project.** They are max-width rules, not
   min-width rules. A normal Tailwind reading gets them backwards.
   - `xs:` and `sm:` → screen width up to 480px
   - `md:` → up to 768px
   - `lg2:` → up to 912px
   - `lg:` → 769px and wider (desktop)

   A phone is under 480px. So on the phone, values in `sm:`, `xs:`, `md:` and
   `lg2:` win over the base class. Ignore `lg:` values, because they are for
   desktop only.
   Example: `p-6 md:p-4 sm:p-3` → the phone uses padding 12.

3. **Font.** The web font is Quicksand (class `font-sans`). Weights:
   `font-light` 300, `font-normal` 400, `font-medium` 500, `font-semibold` 600,
   `font-bold` 700. Use the real Quicksand file for each weight. If a weight
   file is missing from `pubspec.yaml`, report it, because Flutter then draws a
   fake bold that looks different from the web.

4. **Line height.** Tailwind text sizes carry a line height:
   `text-xs` 12/16, `text-sm` 14/20, `text-base` 16/24, `text-lg` 18/28,
   `text-xl` 20/28, `text-2xl` 24/32. `leading-*` overrides it
   (`leading-none` 1, `leading-tight` 1.25, `leading-snug` 1.375,
   `leading-normal` 1.5, `leading-[18px]` = 18px).
   In Flutter, set `TextStyle.height = lineHeight / fontSize` and
   `leadingDistribution: TextLeadingDistribution.even`. The second setting puts
   the text in the middle of the line box, as CSS does.

5. **Colors.** Tailwind v4 default colors (`gray-500`, `red-600`, ...) are
   defined in oklch, not hex. Convert each one to exact sRGB hex. If a Computed
   value is in the chat, use it instead. If you are not sure of a conversion,
   use your best value, mark it with
   `// TODO(ui-parity): check <class> in DevTools Computed`, and list it in the
   report.
   Opacity suffix: `bg-black/40` = black at 40% alpha → `Color(0x66000000)`.
   Arbitrary colors are literal: `text-[#5d5d5d]`.

6. **Inline `style=""` attributes win over classes.** Read them.

7. **Classes you cannot resolve** (project classes such as `xd-*`, or anything
   that is not standard Tailwind): do not invent a value. Keep the app's current
   value for that property, mark it with
   `// TODO(ui-parity): unresolved class <name>`, keep building the rest, and
   list the class in the report.

8. **Ignore what does not exist on a phone:** `hover:`, `cursor-*`, mouse-only
   `focus-visible` outlines, and `lg:` classes.

## CSS → Flutter traps

- CSS flex defaults to `align-items: stretch`. Flutter `Row` / `Column` default
  to center. Set `crossAxisAlignment` on purpose every time.
- `justify-between` → `spaceBetween`, `justify-center` → `center`,
  `items-center` → `CrossAxisAlignment.center`, `flex-1` → `Expanded`,
  `flex-wrap` → `Wrap`, `gap-N` → `spacing: N` (or `SizedBox` between children).
- CSS padding and border sit inside the box (`box-sizing: border-box`). Match
  the total outer size, not only the inner content.
- `rounded-md` 6, `rounded-lg` 8, `rounded-xl` 12, `rounded-2xl` 16,
  `rounded-3xl` 24, `rounded-full` → circle or `StadiumBorder`. Check each
  corner (`rounded-t-*`, `rounded-s-*`, ...).
- `truncate` → `maxLines: 1` + `TextOverflow.ellipsis`.
  `line-clamp-N` → `maxLines: N` + ellipsis.
- A backdrop such as `fixed inset-0 bg-black/50` → the `barrierColor` of the
  dialog or bottom sheet.
- `transition duration-200` → 200ms. Tailwind's default ease
  `cubic-bezier(0.4, 0, 0.2, 1)` is `Curves.fastOutSlowIn`.
- `box-shadow` → `BoxShadow` with the same offset, blur, spread and color.
- `border-b` alone → `Border(bottom: ...)`, not `Border.all`.
- **RTL:** the web uses `dir="rtl"` for Arabic and Kurdish. Use directional
  APIs (`EdgeInsetsDirectional`, `AlignmentDirectional`, start / end), never
  left / right. Tailwind `ms-` / `me-` / `ps-` / `pe-` / `start-` / `end-` map
  to start / end. `rtl:` classes apply in Arabic and Kurdish only.
- Keep Flutter `SafeArea` and keyboard insets. The web has none, but the app
  needs them.

## Work steps

1. Read the whole HTML file and the Flutter file.
2. Resolve every class into a value table: one row per element, each value next
   to the Tailwind class it came from. You need this table for the report.
3. Mark which parts of the Flutter file are logic (leave them) and which are UI
   (change them).
4. Edit the Dart files until every value in the table matches.
5. Go through every class in the HTML, one by one. Each class must be either
   used in the Dart code or listed as ignored with a reason. No class is skipped
   without a note.

## Finish

1. Run `dart format` on the files you changed.
2. Run `flutter analyze` on the files you changed. Fix every problem that your
   change caused. Report any problem that was there before, and leave it alone.
3. Do not commit and do not push. The developer reviews the change first.

Then send a short report:
1. **Files changed or created.**
2. **Value table:** web value → Flutter value, with the source class.
3. **Not matched:** each value you could not match, and why.
4. **Needs input:** unresolved classes, colors to check in the Computed tab,
   missing states, missing font weights, a missing package.
5. **One line:** "No logic, state, API, navigation or translation code was
   changed."

Use exact numbers in the report. Do not write "close to the web" or "similar".
A value either matches exactly or is listed under "Not matched".
