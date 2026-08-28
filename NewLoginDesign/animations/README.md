# Logo motion — the eight patterns

Eight ways the trydos mark can move on the new login screens. Pick one in the
demo route (`/[lang]/loginDemo` → the **Anim:** button, top left).

They are eight different **motion languages**, not eight settings of one. Two
patterns that both "pulse a bit" give nobody anything to choose between.

| # | id | Language | What happens | Best for |
|---|----|----------|--------------|----------|
| 1 | `wink` | character | The dots are eyes. Slow look-around, 110ms blinks at an uneven gap, an occasional one-eyed wink. | The first screen. Friendly. |
| 2 | `bounce` | gravity | The dots fall, land with a volume-keeping squash, bounce twice, rest. The right dot lands 120ms later. | A moment of arrival. |
| 3 | `magnet` | spring | The dots pull together, hold, snap apart, overshoot, settle. A field line crackles across the gap. | Connecting: sign in, pairing, QR. |
| 4 | `wave` | fluid | One sine crosses the mark, the right dot a third of a cycle behind. On the badge the wave runs on into the ring. | Waiting: sending a code. |
| 5 | `comet` | moving light | A glowing head with a fading tail runs the ring and lights its dots. On the header it orbits the dots and slips behind them. | A hero moment. The strongest one. |
| 6 | `radar` | instrument | A wedge turns at a fixed rate, a ping goes out once a turn, each dot answers as the sweep reaches it. All linear. | Verifying, searching, scanning. |
| 7 | `spark` | ambient | Sparkles drift on 28–52 second periods, so the loop is never caught. Dots twinkle underneath. | Long screens: terms, onboarding. |
| 8 | `reveal` | entrance | Ring draws, wordmark wipes in, dots drop on a spring. Plays once, then perfectly still. | The opening screen, or success. |

`none` turns everything off and shows the mark exactly as drawn.

The demo and the product both open on `wink`, set by `DEFAULT_LOGO_ANIMATION`
in `LogoAnimationContext.tsx`.

## The rules every pattern follows

**1. The wordmark never changes.** A pattern cannot give the glyphs a stroke, a
filter, a colour or a transform — there is no prop for any of them. The only
handle it has is a clip path, and a clip can only hide part of the artwork and
hand the rest back exactly as drawn.

This is not a style preference. The usual way to animate a wordmark is to stroke
it and run `stroke-dashoffset` so the letters draw themselves on. These glyphs
are fill-only, so that trick has to *add* a stroke, and a 1.5px stroke on a
176px-wide logo fattens every letter and starts closing the counters — the holes
inside the `d` and the `o`. It looks fine in a screenshot. It is still damage.
`reveal` gets the same effect from a clip path, which cannot deform anything.

**2. The artwork is never retyped.** `logoPaths.ts` is generated from `logo.svg`
and `QuickPreviewBottomLogo.svg`. The component and every mask read those same
strings, so a mask can never drift away from the shape it is masking. If the
brand ships a new svg, regenerate the file — do not patch it.

**3. Decoration goes behind the mark.** Anything a pattern draws is painted
first, so the mark is always on top of it. The one exception is the ring
overlay, which is painted over the ring but masked to the ring's own path — so
it recolours the ring's little dots, keeps the gaps between them empty, and
cannot reach anything else. Painting a plain arc there instead would quietly
turn the dotted ring into a solid one.

**4. Every loop returns to exactly where it started.** No pattern drifts. Stop
any of them at the end of a cycle and the mark is pixel-identical to the static
logo.

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
a picker that shows eight still logos is not a picker.

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
that is not the element, and the pivot lands somewhere else — the radar wedge
swung about a point inside the letters, and the comet head sat still at three
o'clock. `Spin` uses `transform-box: fill-box` and adds one invisible circle
centred on the pivot, which forces the bounding box to be centred there, so
`transform-origin: center` is the pivot exactly.

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
- **No CSS filter on anything that holds a glyph.** The two blur filters in the
  set (`comet`) sit on decoration, never on the mark.
- **Sizes stay in design units.** Patterns read coordinates from
  `geometry.ts`, which is derived from the design files, and distances from
  `maxPullIn()` / `ringCircumference()`. Nothing measures the viewport, so a
  pattern behaves the same at every scale.

`bounce`, `comet`, `spark` and `reveal` move something briefly past the edge of
the svg box, so they set `overflowVisible` and the svg paints outside its box.
The layout box does not change, so nothing on the screen shifts.

## Files

```
animations/
  geometry.ts             where every part of the mark sits, with the working
  color.ts                tints for decoration only
  types.ts                what a pattern is allowed to move
  Spin.tsx                rotation about a named point, the only pivot that works
  normalise.ts            fills in where each animated value starts
  useAnimationEngine.tsx  picks the pattern, namespaces ids, honours reduced motion
  patterns/               one file per pattern, each with its reasoning
```

Covered by three test files:

- `NewLoginLogo.test.tsx` — the mark is unchanged by every pattern, in both
  variants, and lands where the design file puts it.
- `NewLoginLogoServerRender.test.tsx` — the server sends the static mark, every
  animated value says where it starts, every spin is written as keyframes, and
  the reveal wipe ends up larger than the glyphs on all four sides.
- `NewLoginLogoReducedMotion.test.tsx` — every pattern falls back to the static
  mark when the device asks for less motion.

The wordmark box in `geometry.ts` is measured with `getBBox()` in a real
browser, not estimated. An estimate is what cut the descender off the "y" in the
reveal wipe. If the artwork changes, measure it again rather than nudging it.

## Known open issue

**The badge logo's decoration does not run on the Quick Preview screen.** The
dots and the ring animate there; the parts a pattern draws itself — the comet
head and trail, the radar wedge, the sparkles — do not. Everything works on
every other screen, and the header lockup on Quick Preview works too.

Measured, so the next person does not start from nothing:

- On Quick Preview the header logo's `Spin` group reports a turning matrix at
  every sample. The badge logo's `Spin` group reports the identity matrix at
  every sample, from the moment it mounts.
- The same badge logo, same pattern, animates normally on Get Started and Terms.
- The engine is not the cause: the svg reports `data-logo-motion="running"` in
  the failing case, so a pattern was handed out.
- Nothing is thrown, and there is no console error.
- The difference is the surroundings: on Quick Preview the badge sits inside the
  `qp-unified-column` `motion.div`, which starts at `y: 1000` — a thousand pixels
  below the viewport — and animates up. That is the one thing this screen does
  and the others do not, so it is where to look first.

Reproduce it by opening the demo, picking Comet Trail, and watching the badge
while the preview column is still on screen.
