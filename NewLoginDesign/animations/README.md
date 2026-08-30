# Logo motion — the ten patterns

Ten ways the trydos mark can move on the new login screens. Pick one in the
demo route (`/[lang]/loginDemo` → the **Anim:** button, top left).

They are ten different **motion languages**, not ten settings of one. Two
patterns that both "pulse a bit" give nobody anything to choose between — which
is what happened to the seven this set replaced (`bounce`, `magnet`, `wave`,
`comet`, `radar`, and later `turn` and `thread`). They are gone. Do not bring a
geometric demo back: the ones that survived review read as alive or as
expensive, and the ones that read as a physics exercise did not.

| # | id | Language | What happens | Best for |
|---|----|----------|--------------|----------|
| 1 | `wink` | character | The dots are eyes. Wide sideways glances that dart in 92ms and hold, 95ms blinks at an uneven gap, an occasional one-eyed wink. | The first screen. Friendly. |
| 2 | `relay` | weight | One dot pulls back, stretches across and hands its weight to the other, which is knocked back on the frame of contact. The word is dragged after it; the ring absorbs the knock. | Cart, checkout — anything exchanged. |
| 3 | `firefly` | character | A sparkle flies a slow lap and both eyes follow it round, aimed at it separately so they converge as it passes close. It goes behind the letters and out the other side. | Any screen. The eyes move for a reason. |
| 4 | `canon` | character | One eye leads a glance, the other arrives a quarter-second late, overshoots and settles. The dot that leads is always the one moving away. | A screen with personality. |
| 5 | `tempo` | staccato | 100 BPM, sixteen slots, six used — the 3-3-2 tresillo. Every move is linear and 58ms; every hold is dead flat. | A screen that needs energy. |
| 6 | `spark` | ambient | Sparkles drift on 28–52 second periods, so the loop is never caught. Dots twinkle underneath. | Long screens: terms, onboarding. |
| 7 | `reveal` | build | Ring draws, wordmark wipes in, dots drop. Ends assembled and holds there; it never reverses and never repeats. | A screen that is held, such as Quick Preview. |
| 8 | `gust` | wave | Wind crosses in 900ms. Each letter leans, lifts and settles 60ms after the one to its left; the same wave runs round the ring. Then six seconds of calm. | Any screen. |
| 9 | `escape` | comedy | The last letter slips and tips over. The eyes snap to it, then narrow into a flat stare held for a whole second. Then it hops back. | Get Started, Success. Not a PIN screen. |
| 10 | `sway` | solid body | The whole mark hangs from a point above itself and swings as one object. The two dots run the swing 100ms late. | Anywhere calm. The most restrained one. |

`none` turns everything off and shows the mark exactly as drawn.

The demo and the product both open on `wink`, set by `DEFAULT_LOGO_ANIMATION`
in `LogoAnimationContext.tsx`.

`gust`, `escape` and `sway` are newer than the other seven and need a change
to the artwork — see **The word, two ways** below.

## Every loop is 4 seconds

Nine of them run on the same 4 second cycle. `reveal` runs on 4.5, because it
has to fit a build, a hold and the same build in reverse; at 4 the hold is too
short to read as a finished mark.

One thing is deliberately **not** 4 seconds: the slow background turn some
patterns give the badge ring, which runs from 40 to 80 seconds. A ring that
laps in 4 seconds is a loading spinner, and a logo should not look like it is
waiting for a server.

Two patterns paid a price for the shorter cycle, and it is worth knowing which:

- **`spark`** was built on periods of 28 to 52 seconds so the eye could never
  catch a repeat. Those are now 4 to 7.3 seconds. The five still never line up
  with each other, so the idea survives — but a patient viewer can now find
  the loop, which is the one thing the long periods existed to prevent.
- **`escape`** is built around a held stare. Everything else in it was
  squeezed to fit 4 seconds; the stare kept its full second, because a pause
  that is over before it registers is not a pause. The calm either side gave
  up the time instead.


## All three elements take part

The logo is three things — the two dots, the wordmark, and (on the badge) the
dotted ring — and a pattern that only moves the dots is animating a third of the
mark. Every looping pattern above moves all three.

## The word, two ways

The wordmark is the awkward one, because **no pattern may reshape a glyph**.
There are two ways round that, and which one a pattern uses is its own choice.

**A ghost behind it — `WordmarkEcho.tsx`.** It paints a second copy of the same
glyph outline *behind* the real one and animates that, so what moves is a tinted
ghost showing a couple of px along one edge. The real letters are the same path
with the same fill, on top, untouched. Keep it to 1–2px and 10–20% opacity; past
that it stops reading as a shadow and starts reading as a printing plate out of
register, which on a logo is damage rather than motion. `relay`, `canon` and
`tempo` use it.

**One path per letter — `letters`.** A pattern that sets `letters` in its
`LogoMotion` gets the word drawn as one group per letter and may translate,
rotate, evenly scale and fade each one. `gust`, `escape` and `sway` use it, and
none of them could exist without it: a wave needs things in a row, one letter
leaving a word needs the word to have separate letters, and a rigid body needs
every part of itself to be able to move.

The letter data is generated. `scripts/split-wordmark.mjs` cuts the single path
into its subpaths, groups them into letters by containment — so the counter of
an "o" stays in the same path as its outline, which is the only way the fill
rule still cuts the hole — and writes `HEADER_LETTERS` and `BADGE_LETTERS` at
the bottom of `logoPaths.ts`. Two things are checked rather than assumed:

- The script samples every curve before and after the split and fails if any
  point moved by more than 1e-6. It reports `ok` per wordmark when it runs.
- The union of the generated letter boxes matches the browser-measured wordmark
  box in `geometry.ts` to within 0.0011 units.

The split is only equivalent because **no two letters overlap** — the header
gaps are 6.66, 5.20, 6.84, 7.88 and 5.85 units, the badge gaps 6.70 and 5.23. A
wordmark with joined script letters would break that, which is why the single
path is still the default and is still what the other seven patterns draw.

**Even scale only.** A letter may be scaled, but on both axes together.
`scaleX` on its own is not motion, it is a condensed typeface nobody licensed.

**A clip is still the right tool for a build.** `reveal` uncovers the word and
later covers it again, and a clip does both without deforming anything. What a
clip must never do is stay half-closed at the end of a cycle: the wipe opens to
wider than the glyphs on all four sides and closes back to nothing, so every
cycle starts from the same place.

## The rules every pattern follows

**1. The glyphs are never reshaped.** A pattern cannot give a letter a stroke, a
filter or a colour — there is no prop for any of them. It may move a whole
letter, and it may hide part of the word with a clip. It receives only the
outline the design file drew, so there is nothing for it to reshape.

This is not a style preference. The usual way to animate a wordmark is to stroke
it and run `stroke-dashoffset` so the letters draw themselves on. These glyphs
are fill-only, so that trick has to *add* a stroke, and a 1.5px stroke on a
176px-wide logo fattens every letter and starts closing the counters — the holes
inside the `d` and the `o`. It looks fine in a screenshot. It is still damage.
`reveal` gets the same effect from a clip path, which cannot deform anything.

**2. The artwork is never retyped.** `logoPaths.ts` is generated from `logo.svg`
and `QuickPreviewBottomLogo.svg`. The component, every mask and `WordmarkEcho`
read those same strings through `geometry.ts`, so a mask can never drift away
from the shape it is masking. If the brand ships a new svg, regenerate the file
— do not patch it.

**3. Decoration goes behind the mark.** Anything a pattern draws is painted
first, so the mark is always on top of it. The one exception is the ring
overlay, which is painted over the ring but masked to the ring's own path — so
it recolours the ring's little dots, keeps the gaps between them empty, and
cannot reach anything else. Painting a plain arc there instead would quietly
turn the dotted ring into a solid one.

**4. Every loop returns to exactly where it started.** No pattern drifts. Stop
any of them at the end of a cycle and the mark is pixel-identical to the static
logo. In practice: the last keyframe of every list equals the first, and a
rotation ends on a multiple of 360. Nothing enforces it, and a list that ends
1px out gives one bad frame every few seconds — far enough apart that nobody
catches it while reviewing the animation, and close enough that everybody
notices it on the login screen afterwards. `reveal` obeys this the hard way:
every beat that runs `a -> b` on the way in runs `CYCLE - b -> CYCLE - a` on the
way out, so the last keyframe is the first one by construction.

The same care goes for the arrays themselves: `times` must be the same length as
its keyframes, and an `ease` array must be one shorter. Framer Motion does not
complain about either — it just plays something other than what was written.

**5. Reduced motion wins — and it is the first thing to check.** If the device
asks for less motion, every pattern falls back to the static mark, not to a
slower version of itself. Windows (Settings, Accessibility, Visual effects,
"Animation effects") and macOS (Accessibility, Display, "Reduce motion") both
have this switch, and plenty of machines have it on. With it on, every pattern
shows a still logo and nothing tells you why.

The demo route therefore opens with **Motion: forced**, a third button in the
top-left bar that plays the pattern whatever the device says. Switch it to
**Motion: device** to see what a shopper with the setting on would see. The
product itself always follows the device; only the demo can override it, because
a picker that shows seven still logos is not a picker.

**5a. The server sends the static mark; motion starts in the browser.** Framer
Motion has no clock on the server, so a motion element rendered there with an
`animate` target and no `initial` writes the *target* into the html — a ring
told to turn to 360 degrees arrives already turned to 360. The browser hydrates,
sees it is already there, and never animates. That looks exactly like a dead
pattern, and only on server rendered screens. The engine holds motion back to
after mount, which removes the whole class of fault and the hydration mismatch
along with it.

**5b. Every animated value says where it starts.** Framer Motion writes svg
values as attributes, not only as styles, and an animated attribute with no
starting value is written out as the string `"undefined"` on the first render —
`r="undefined"`, `opacity="undefined"`. The browser rejects it and drops the
shape, with only a console message to say so. `normalise.ts` copies the first
keyframe into `initial` for the dots and the ring; decorations set their own.

**5c. Rotation goes through `Spin`, never through `transform-origin`.** On an
svg element `transform-origin: 75px 75px` is measured against a reference box
that is not the element, and the pivot lands somewhere else — the old radar
wedge swung about a point inside the letters, and the comet head sat still at
three o'clock. `Spin` uses `transform-box: fill-box` and adds one invisible
circle centred on the pivot, which forces the bounding box to be centred there,
so `transform-origin: center` is the pivot exactly.

**6. Ids are namespaced per logo.** The Quick Preview shows two logos at once and
svg ids are global to the document, so every mask, filter and gradient id starts
with a `useId` value. Without that the second logo's mask captures the first.

## How it fits the scaled canvas

The whole auth flow renders inside `scaling/AppScaler`, a 430×932 canvas that is
CSS-scaled to the viewport. Three things follow, and the patterns keep to them:

- **No `will-change` anywhere.** On this canvas `will-change` promotes a layer
  above the scaled surface and blurs text. Framer Motion is left to manage its
  own transforms on the dot and ring groups only — never on the wordmark, which
  stays a plain `<path>`.
- **No CSS filter on anything that holds a glyph.** No pattern in the set uses a
  filter at all now; the two that did went with `comet`.
- **Sizes stay in design units.** Patterns read coordinates from
  `geometry.ts`, which is derived from the design files, and distances from
  `maxPullIn()` / `ringCircumference()`. Nothing measures the viewport, so a
  pattern behaves the same at every scale.

Most patterns move something briefly past the edge of the svg box, so they set
`overflowVisible` and the svg paints outside it. The layout box does not change,
so nothing on the screen shifts.

That makes the box a soft edge rather than a hard one, so the **horizontal reach
of a glance has to be checked by hand** — a dot that walks off the left of the
lockup keeps being painted out there rather than being clipped and noticed. The
header is the tight variant: its left dot's edge starts 12.6 from x=0, so about
8.5 is the widest a sideways glance can be. `wink`, `firefly` and `canon` all
sit under that on purpose.

Two dots also cannot pass through each other. Their centres are 30.2 apart and
they are 22.6 wide, so there is 7.5 of air between them, and any pattern moving
them *towards* each other is capped by it. That is the whole reason `canon`
leads each glance with the dot moving **away**: leading with the near one would
spend the 7.5 during the quarter-second of lag, so its glances would be stuck at
about 3px instead of 8.5.

## Files

```
animations/
  geometry.ts             where every part of the mark sits, with the working
  color.ts                tints for decoration only
  shapes.ts               decoration outlines shared between patterns
  types.ts                what a pattern is allowed to move
  Spin.tsx                rotation about a named point, the only pivot that works
  WordmarkEcho.tsx        a ghost of the word, for patterns with one path
  normalise.ts            fills in where each animated value starts
  useAnimationEngine.tsx  picks the pattern, namespaces ids, honours reduced motion
  patterns/               one file per pattern, each with its reasoning

scripts/split-wordmark.mjs  regenerates the per-letter wordmark data, and
                            checks the split moved no outline
```

Covered by three test files:

- `NewLoginLogo.test.tsx` — the mark is unchanged by every pattern, in both
  variants, and lands where the design file puts it. It checks both draw
  forms: a pattern without `letters` must render the single path from the
  design file, and a pattern with them must render the generated letter
  outlines in order — neither may be rewritten, stroked, filtered or
  recoloured.
- `NewLoginLogoServerRender.test.tsx` — the server sends the static mark, every
  animated value says where it starts, every spin is written as keyframes, and
  the reveal wipe ends up larger than the glyphs on all four sides.
- `NewLoginLogoReducedMotion.test.tsx` — every pattern falls back to the static
  mark when the device asks for less motion.

Rule 4 and the two reach limits above are **not** covered by a test. They are
checked by reading the keyframe lists. If a seam or an off-the-edge glance ever
ships, that is the gap to close.

The wordmark box in `geometry.ts` is measured with `getBBox()` in a real
browser, not estimated. An estimate is what cut the descender off the "y" in the
reveal wipe. If the artwork changes, measure it again rather than nudging it.

## Known open issue

**The badge logo's decoration does not run on the Quick Preview screen.** The
dots and the ring animate there; the parts a pattern draws itself — the
sparkles, the firefly — do not. Everything works on every other screen, and the
header lockup on Quick Preview works too.

Measured, so the next person does not start from nothing:

- On Quick Preview the header logo's `Spin` group reports a turning matrix at
  every sample. The badge logo's `Spin` group reports the identity matrix at
  every sample, from the moment it mounts.
- It matters more than it did. `firefly` is mostly decoration, and on a screen
  where decoration does not run its eyes track a sparkle that is standing still.
  Judge that pattern anywhere but here until this is fixed.
- The same badge logo, same pattern, animates normally on Get Started and Terms.
- The engine is not the cause: the svg reports `data-logo-motion="running"` in
  the failing case, so a pattern was handed out.
- Nothing is thrown, and there is no console error.
- The difference is the surroundings: on Quick Preview the badge sits inside the
  `qp-unified-column` `motion.div`, which starts a thousand pixels below the
  viewport and animates up, inside `#master-canvas`, which sets `contain:
  strict`. That pair — a subtree parked outside a paint-contained box — is the
  one thing this screen does and the others do not, so it is where to look
  first.

Reproduce it by opening the demo, picking Firefly or Constellation, and watching
the badge while the preview column is still on screen.

It also decides how the newest patterns behave on that screen. `gust` loses
the wave running round the ring, because that part is decoration, but keeps
the letters and the eyes, so most of it still reads. `escape` and `sway` draw
no decoration at all, so they are the two to demo on Quick Preview until this
is fixed.
