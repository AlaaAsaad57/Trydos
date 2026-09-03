# New login design — matching the XD file

**Status:** Ticket A and Ticket B are both done. Nothing is committed yet.
**Design file:** `../animation decission/NewLoginDesign.xd` (outside the repo).
**Code:** `NewLoginDesign/`, `scaling/`, `components/Login/Enhanced/ui/`.

The designer says the new login does not respect his spaces, sizes and weights.
This document says exactly where it differs, why, and how to fix it. Every
number below was read out of the XD file or measured in a browser. Nothing is
guessed. Where the XD file contradicts itself, that is written down too.

---

## 1. How the numbers were read

The `.xd` file is a ZIP. Each artboard is one JSON file at
`artwork/artboard-<id>/graphics/graphicContent.agc`. The artboard's position on
the pasteboard is in `manifest` under `uxdesign#bounds`.

Three rules make the JSON readable:

1. Subtract the artboard `uxdesign#bounds` x/y to get artboard-local coordinates.
2. A text node with `frame.type = "positioned"` stores its **baseline** in `y`.
   A node with `frame.type = "autoHeight"` stores the **top** of its box.
3. Quicksand's ascender is exactly 1.0 em, so **top = baseline − font-size**.
   Every `y` in this document is already converted to a top edge.

Only three nodes in the whole file are rotated or scaled: the two lines of the
close "X", and the Turkey flag group. Every other bounding box can be read
straight from the transforms.

Rendered positions were measured with Playwright against `pnpm dev` at
`/sy-en/loginDemo`, reading each element's client rect and dividing by the
canvas scale to get design px.

---

## 2. The canvas

Every one of the 22 artboards is **430 x 932**. That already matches
`scaling/scale.config.ts` (`DESIGN_W = 430`, `DESIGN_H = 932`).

Artboard to screen:

| Artboard | Screen |
|---|---|
| `Login - 1`, `Login -2` | phone number, sign in |
| `Registration - 8` / `- 6` / `- 7` | phone number, sign up (empty / typing / filled) |
| `Registration - 15` | SMS or WhatsApp |
| `Registration - 12` / `- 17` / `- 19` / `- 16` / `- 18` | code: empty / typed / correct / expired / wrong |
| `Registration - 36` | name entry |
| `Registration - 26` | already registered |
| `Registration - 25` | not registered |
| `Registration - 27` | sign-up success |
| `Registration - 33` | welcome (sign-in success) |
| `Registration - 2` | terms |
| `Registration - 3` | get started |
| `Registration` / `- 4` | quick preview (Next / Get Started) |
| `Registration - 1` | QR "switch from your app" sheet |
| `Ramaaz pay signin - 14` | slogan pill at the bottom, badge peeking |

---

## 3. The grid

All values are design px, measured from the top-left of the 430 x 932 canvas.

```
   60   top-right control      close "X" 15x15 at x385  |  QR icon 25x25 at x375
        (both sit 30 in from the right edge)
  116   logo 150x150 at x140   (quick preview 98 - get started and terms 390)
  266   logo bottom
  288   title       30 Bold  #1D1D1D
  318   title bottom
  338   line 2      16
  354   line 2 bottom
  366   line 3      12
  378   line 3 bottom
  389   line 4      11  #4A31E7
  400   line 4 bottom
  503   input row   390x60 at x20, radius 20
        OTP row     six 60x60, radius 15, gap 6, from x20 to x410
        method row  two 193x60, radius 20, gap 4, from x20 to x410
  563   input row bottom
  583   the native keyboard starts. Nothing interactive may sit below this line.
  721   second button 390x60
  789   primary button 390x60
  849   primary button bottom
  879   bottom link 14
  893   bottom link bottom
  932   canvas bottom
```

Screens that move:

- **Method and code screens** add a row. Line 4 moves to **412**, and the
  privacy line to **435** on the expired screen (`Registration - 16`).
- **Error and expired code**: the six OTP boxes lift to **493**, and a message
  in 11 Medium `#1D1D1D` is centred at **561**.
- **Get started**: no top badge. Logo **390**. Title **649**. Buttons **721**
  and **789**. Link **879**.
- **Terms**: logo **390**. Body **600**. Icon 25x25 at **(202, 688)**. Link line
  **721**. Button **789**. Link **879**.
- **Quick preview**: pill **56**, logo **98**, title **268**, card **326**
  (390x473), dots **809**, button **837**, canvas bottom 932.

Left edges: **text 40**, **boxes 20** (390 wide). Nothing uses 30.

---

## 4. The type convention

Read from `public/fonts/quicksand-variable.ttf`:

```
unitsPerEm 1000 - ascender 1000 (1.0 em) - descender -250 - lineGap 0
USE_TYPO_METRICS = true - capHeight 700
```

Ascender plus descender is exactly **1.25 em**. So with

```css
.font-quicksand { line-height: 1.25 }
```

the half-leading is zero, and the baseline sits exactly 1.0 em under the box
top. That is the same place XD puts it. The CSS box top then lands on the XD
top with no arithmetic at all.

Two things fall out of it for free:

- Gaps inside the head block become **12.5 / 8 / 8**:
  `338 - (288 + 30*1.25) = 12.5`, `366 - (338 + 16*1.25) = 8`,
  `389 - (366 + 12*1.25) = 8`.
- A 16 px label centred in a 60 px box lands its baseline at 36 from the box
  top. XD says 36.

Today the code mixes `.text-trim-descend` (box = cap to descender = 0.95 em)
with plain Tailwind (`line-height: 1.5`). That is why two screens with the same
`mt-xd-*` value show two different gaps.

**Wrapping blocks keep their own XD line-height**: terms body `1.43` (20 on
14 px), QR paragraph `1.54` (20 on 13 px).

### Sizes and weights

The file uses **three weights only**: Quicksand Regular (400), Medium (500),
Bold (700). No SemiBold, no Light.

| Role | Size | Weight | Colour | XD line-height |
|---|---|---|---|---|
| title | 30 | Bold | `#1D1D1D` | 20 |
| line 2 | 16 | see below | `#1D1D1D` | 12 |
| line 3 | 12 | see below | `#1D1D1D` | 16 |
| privacy line | 11 | Regular | `#4A31E7` | 16 |
| blue action line | 12 | Medium | `#388CFF` | 16 |
| grey hint | 12 | Regular | `#C3C3C3` | 16 |
| input value, OTP digit, `+` | 16 | Medium | `#1D1D1D` | 12-20 |
| placeholder | 16 | Regular | `#C3C3C3` | 20 |
| button label | 16 | Regular | `#5D5C5D` / `#3C3C3C` / `#FFFFFF` | 20 |
| bottom link | 14 | Regular | `#4D84FF` | 20 |
| slogan pill | 14 | Regular | `#4A31E7` | 30 |
| message under the OTP | 11 | Medium | `#1D1D1D` | 16 |
| QR list line | 14 | Regular | `#1D1D1D` | 16 |
| QR paragraph | 13 | Regular | `#5D5C5D` | 20 |

Lines 2 and 3 swap weight between artboards. Resolved per screen, majority wins:

| Screen | line 2 (16) | line 3 (12) | Evidence |
|---|---|---|---|
| phone number | **Regular** | **Medium** | `Login-1`, `Login-2`, `Reg-6`, `Reg-7` agree. `Reg-8` is the lone outlier |
| method | **Medium** | **Regular** | `Reg-15` |
| code entry | **Medium** | **Regular** | `Reg-12`, `16`, `17`, `18`, `19` all agree |
| outcome screens | **Medium** | **Regular** | `Reg-25`, `26`, `27`, `33`, `36` all agree |

### Letter spacing

XD sets `letterSpacing: 10` (= **0.01 em**) on exactly three labels:
`login & Continue`, `Create new account & Continue`,
`Cancel & take a look at the app`. Everything else is 0.

---

## 5. Colours

| Hex | Used for |
|---|---|
| `#1D1D1D` | body text, active pager dot, QR backdrop |
| `#4A31E7` | privacy line, slogan text, quick-preview card border and button |
| `#402CDD` | **logo artwork only** — never a button or a background |
| `#28C452` | logo, name entry and sign-up success |
| `#FAAA2E` | logo dots, not registered |
| `#388CFF` | focused border, blue action text, "already registered" SIM icon |
| `#4D84FF` | bottom links, active and filled OTP border |
| `#5D5C5D` | button label, dashed border, grey paragraph |
| `#C3C3C3` | placeholder, idle OTP border, grey hint, code-screen SIM icon |
| `#8D8D8D` | keyboard block, `+` when empty, name-input border |
| `#3C3C3C` | "agree & continue" label, SMS icon |
| `#707070` | dashed border on the two outcome screens |
| `#FF5F61` | close icon, wrong-code OTP border |
| `#FDCA57` | expired-code OTP border |
| `#78D97F` on `#FCFFFC` | correct-code OTP |
| `#FBAB2D` | SIM icon, not registered |
| `#35CE3F` | WhatsApp icon |
| `#FCFCFC` / `#FAFAFA` | button fills |
| `#F8F7FF` | slogan pill fill |
| `#C4C2C2` | sheet grab handle |
| `#404040` | inactive pager dot outline |

Screen backgrounds:

| Screen | XD |
|---|---|
| already registered | `#F4F8FF` |
| not registered | `#FFF9F0` |
| name entry | `#F4FFF4` |
| sign-up success | `#D8FFEA` |
| welcome | `#FFFEF2` |
| everything else | `#FFFFFF` |

**Four colours in the code are not in the design file at all:** `#8E8E8E`
(OTP dot, resend separators), `#F4F0FE` and `#ECE9FE` (quick-preview pill), and
`#402CDD` used as a **button fill**.

### Logo colour per screen

XD recolours the ring (`Path 23332`) and the two eye dots
(`Path 23318` / `23319`) on their own. The wordmark is always `#1D1D1D`.

| Screen | ring | dots |
|---|---|---|
| not registered | `#402CDD` | `#FAAA2E` |
| name entry | `#28C452` | `#28C452` |
| sign-up success | `#28C452` | `#28C452` |
| welcome | `#402CDD` | `#402CDD` |
| every other screen | `#402CDD` | `#402CDD` |

---

## 6. Components

Every border in the flow is **0.5 px, dash `3 3`, aligned inside**. Colour
changes by state. No border is ever drawn at reduced opacity.

**Wide input or button** — 390 x 60 at x 20, radius **20**.

**Phone input**, measured from the box's own left edge:

| Part | Position | Size |
|---|---|---|
| flag | +20, 6.5 **above** the box top | 20 x 13 |
| phone icon | +19.7, vertically centred | 20.9 x 24.3 |
| `+` | +52 | 16 Medium |
| number | +65 | 16 Medium |
| caret line | at the text, baseline + 8 | 10 x 1, `#1D1D1D` |
| send arrow | +350 (right inset 20) | 20 x 20 |

Idle border `#5D5C5D`. Focused or filled `#388CFF`.
The placeholder is left-aligned and starts exactly at the caret. XD stores it as
"centred" only because of the string width — checked against the real Quicksand
advance widths.

**OTP boxes** — six, **60 x 60**, radius **15**, gap **6**, x 20 to 410.

| State | fill | stroke | dashed |
|---|---|---|---|
| idle | `#FCFCFC` | `#C3C3C3` | yes |
| active | `#FFFFFF` | `#4D84FF` | yes |
| filled | `#FFFFFF` | `#4D84FF` | **no** |
| correct | `#FCFFFC` | `#78D97F` | no |
| wrong | `#FFFFFF` | `#FF5F61` | yes |
| expired | `#FCFCFC` | `#FDCA57` | yes |

Digit 16 **Medium** `#1D1D1D`. There is **no blinking dot** in an empty box.

**Method buttons** — two 193 x 60, radius 20, at x 20 and x 217 (gap 4).
Icon 20 x 20, **12** from the button's left edge, **10 above** the top edge, so
it straddles the border. Selected fill `#FCFCFC` border `#388CFF`. Unselected
fill `#FFFFFF` border `#C3C3C3`.

**Slogan pill** — **206 x 30**, radius **12**, fill `#F8F7FF`, **no border**.
Text 14 Regular `#4A31E7`, 12 in from the left, vertically centred.

**Pager dots** — three, step 14, gap 6, total 44, centred at 215, at y 809.
Inactive **8 x 8**, outline 1 px `#404040`, no fill. Active **16 x 8**, filled
`#1D1D1D`, radius full.

**Quick-preview card** — 390 x **473** at (20, 326), radius 20, stroke
`#4A31E7` **0.5 solid**, white fill. The drop shadow in the file is turned
**off** (`visible: false`).

**Quick-preview button** — 390 x 60 at y 837.
"Next": fill `#FCFCFC`, dashed `#4A31E7` 0.5, label `#5D5C5D`.
"Get Started": fill **`#4A31E7`** solid, no stroke, label white.

**QR sheet** (`Registration - 1`):

| Part | Value |
|---|---|
| backdrop | `#1D1D1D` at opacity **0.9** |
| sheet | from y **90**, 430 x 841, top radius **30**, `#FFFFFF` |
| sheet shadow | `0 -3 10 rgba(0,0,0,0.10)` |
| grab handle | 40 wide, **2 px**, `#C4C2C2`, at (195, 102) |
| QR code | **250 x 250** at (90, 171.5), centred |

That artboard also carries the get-started buttons and text that says "RDB".
Both are leftovers from another design. **Take only the sheet from it**, and
keep "Trydos".

---

## 7. Measured today vs the design

Rendered at four viewports, `/sy-en/loginDemo`, phone screen. `top` is design px.

| Element | XD | 430x932 | 430x745 (iPhone Safari) | 390x844 |
|---|---|---|---|---|
| logo | **116** | 100 (-16) | **24 (-92)** | 99 (-17) |
| title | **288** | 273.5 (-14.5) | **182.5 (-105.5)** | 273 (-15) |
| line 2 | **338** | 314.5 (-23.5) | **223.5 (-114.5)** | 314 (-24) |
| line 3 | **366** | 339.5 (-26.5) | **248.5 (-117.5)** | 339 (-27) |
| line 4 | **389** | 362 (-27) | **271 (-118)** | 361.5 (-27.5) |
| input box | **503** | 483.5 (-19.5) | **392.5 (-110.5)** | 483 (-20) |
| `--xd-flex-deficit` | - | 0 px | **182 px (at its cap)** | 1.4 px |

Get started:

| Element | XD | measured |
|---|---|---|
| logo | **390** | 280 (-110) |
| title | **649** | 628 (-21) |
| button 1 | **721** | 709 (-12) |
| button 2 | **789** | 777 (-12) |
| link | **879** | 873 (-6) |
| QR icon | **(375, 60)** 25x25 | (376, 30) 24x24 |

Two separate faults:

1. **Even at the perfect canvas** everything is 15 to 27 px too high, because
   the blocks are placed by flow instead of by anchor, and because
   `.text-trim-descend` changes the box height on some screens and not others.
2. **On iPhone Safari the flex budget is fully spent.** `--xd-flex-deficit`
   reaches its cap of 182, so every `FlexibleSpace` is squeezed by its whole
   `share`, and the layout drops about **110 px** away from the design. That is
   the phone the designer is looking at.

---

## 8. Every difference found

File and line numbers are where the fix goes.

### 8.1 The scaler

| # | What | Where |
|---|---|---|
| 1 | The canvas reshapes itself on a short screen instead of scaling. On iPhone Safari the deficit is at its 182 cap and nothing sits where the design puts it. | `scaling/AppScaler.tsx` |
| 2 | The guard meant to ignore the Safari bars never fires. It divides `screen.availHeight` (already CSS px) by `devicePixelRatio`, so on a DPR-3 phone the test is `innerHeight < 217`, which is never true. | `scaling/AppScaler.tsx:78-82` |

### 8.2 Dead CSS classes (silently do nothing) — FIXED in ticket A

Nine, not five. `tests/styles/xdUtilities.test.ts` found four more than the
hand search did:

`h-xd-138` (the title block on **both** code screens), `w-xd-260`, `h-xd-260`
(QR box), `pb-xd-10`, `rounded-xd-16`, and the four negative offsets
`-top-xd-100`, `-bottom-xd-100`, `-start-xd-100`, `-end-xd-100` that place the
two blurred background circles in `components/Login/Enhanced/screens/
SplashScreen.tsx`. All nine are now defined, and the test fails if a tenth
appears.

### 8.3 Type

| # | What | XD | Code |
|---|---|---|---|
| 3 | no shared box convention | line-height 1.25 | mix of `text-trim-descend` (45 uses) and Tailwind 1.5 |
| 4 | head gaps | 12.5 / 8 / 8 | `pt-xd-12/8/8`, `mt-xd-10/6`, `mt-xd-8/4` — three screens, three answers |
| 5 | privacy line weight | Regular | `font-medium` (`NewEnterPhoneScreen.tsx:113`) |
| 6 | name input value weight | Regular | `font-medium` (`NewInputNameScreen.tsx:91`) |
| 7 | OTP digit weight | Medium | `font-semibold` (`RdbPinInputs.tsx:199`) |
| 8 | letter spacing on 3 labels | 0.01 em | none |

### 8.4 Position

| # | What | XD | Code |
|---|---|---|---|
| 9 | logo, top stop | 116 | 100 |
| 10 | logo, centre stop | 390 | 280 |
| 11 | logo, quick preview | 98 | uses the top stop |
| 12 | top-right control | y **60** | `top-xd-30` on all 6 screens |
| 13 | QR scan icon size | 25 | 24 |
| 14 | text left on 4 outcome screens | 40 | `px-xd-30` |
| 15 | CTA to link gap | 30 | `mt-xd-20` |
| 16 | link to canvas bottom | 39 | `FlexibleSpace size={35}` |
| 17 | error/expired OTP row | lifts to 493, message at 561 | row stays, message pushed down with `mt-xd-8` |

The right inset of the top-right control (`right-xd-30`) is **already correct**.

### 8.5 Phone input (`components/Login/Enhanced/ui/RdbPhoneInput.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 18 | box | x 20, w 390 | x 24, w 382 (`m-1` on line 213) |
| 19 | border | 0.5 dashed 3/3 | `border` = 1 px, browser dash |
| 20 | idle border colour | `#5D5C5D` | `#C3C3C3` |
| 21 | flag left inset | 20 | `start-xd-16` |
| 22 | phone icon | 20.9 x 24.3 | `size-xd-20` |
| 23 | `+` left inset | 52 | 41 |
| 24 | send arrow | 20 x 20 at inset 350 | 28 x 28 at 337 |
| 25 | caret | 10 wide | 11 wide |

### 8.6 OTP (`components/Login/Enhanced/ui/RdbPinInputs.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 26 | gap | 6 | `gap-xd-5` |
| 27 | border width | 0.5 | 1 px |
| 28 | active and filled border | `#4D84FF` full | `#4D84FF`/50 |
| 29 | vertical margin | none | `my-xd-2` |
| 30 | dot in an empty box | none | a blinking `#8E8E8E` dot |

### 8.7 Method screen (`NewLoginDesign/NewSelectMethodScreen.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 31 | container | 390 | `w-xd-400` |
| 32 | each button | 193, gap 4 | `flex-1` inside 400 with `mx-0.5` gives about 196 |
| 33 | icon left inset | 12 | `left-xd-14` |
| 34 | border | 0.5 dashed | 1 px |
| 35 | extra margins | none | `my-1` |
| 36 | the number row | one string, all 12 **Medium `#388CFF`**, no underline | number `#1D1D1D` plus a separate underlined `Edit` |

### 8.8 Code entry (`NewLoginDesign/NewEnterPinScreen.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 37 | resend line | one line, 12 Medium `#388CFF`, no underline | `text-xd-13` underlined links |
| 38 | the separator word "or" | part of the same blue string | `text-xd-12 text-[#8E8E8E]` |
| 39 | grey hint | 12 Regular `#C3C3C3` at x 146 | present, different size and colour |

### 8.9 Terms (`NewLoginDesign/NewTermsScreen.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 40 | body text | one colour, no bold | bolds "Trydos" (line 31) |
| 41 | body top | 600 | placed by flow |
| 42 | icon | 25 x 25 at (202, 688) | wrapped in `w-xd-40 h-xd-40`, adds 7.5 above and below |
| 43 | CTA border | `#5D5C5D` 0.5, full colour | `border-[#5D5C5D]/50` 1 px |
| 44 | CTA | no extra margin | `m-1` |

### 8.10 Already registered and not registered

| # | What | XD | Code |
|---|---|---|---|
| 45 | CTA border colour | `#707070` | `#5D5C5D`/40 |
| 46 | CTA border width | 0.5 | 1 px |
| 47 | number to icon gap | 7.5 | `gap-xd-2` plus `ml-2` = 10 |
| 48 | `pb-xd-10` | - | a dead class |

The not-registered CTA sits at **790** in the file. Four other artboards say
789. Use **789**.

### 8.11 Success and welcome (`NewLoginDesign/NewSuccessScreen.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 49 | sign-up success background | `#D8FFEA` | `#E0FFEE` |
| 50 | welcome background | `#FFFEF2` | `#E0FFEE` |
| 51 | welcome logo | purple `#402CDD` | green |

The code merged the two screens into one green screen on purpose (see the
comment at `NewSuccessScreen.tsx:41-47`). The design keeps them apart.

### 8.12 Name entry (`NewLoginDesign/NewInputNameScreen.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 52 | input box | 390 at x 20 | 400 at x 15 (`px-xd-15` plus `w-full`) |
| 53 | border colour | `#8D8D8D` | `#C3C3C3` |
| 54 | placeholder colour | `#C3C3C3` | `#1D1D1D`/40 |
| 55 | inner padding | about 20 | `px-xd-16` |

### 8.13 Quick preview (`NewLoginDesign/QuickPreviewScreen.tsx`)

| # | What | XD | Code |
|---|---|---|---|
| 56 | pill height | 30 | `h-xd-32` |
| 57 | pill radius | 12 | `rounded-[16px]` |
| 58 | pill fill | `#F8F7FF` | `#F4F0FE` |
| 59 | pill border | none | 1 px `#ECE9FE` |
| 60 | pill text colour | `#4A31E7` | `#1d1d1d` |
| 61 | pill width | fixed 206 | auto |
| 62 | card border | 0.5 | `border-[1px]` |
| 63 | card shadow | off in the file | a shadow is added |
| 64 | active dot | 16 x 8 | 18 x 6 |
| 65 | inactive dot | 8 x 8, outline `#404040` | 6 x 6, outline `#1D1D1D` |
| 66 | dot gap | 6 | `gap-xd-8` |
| 67 | CTA fill | `#4A31E7` | `#402CDD` |
| 68 | CTA shadow | none | a shadow is added |
| 69 | "Next" dash width | 0.5 | 0.75 |
| 70 | pill to logo | 12 | 14 |
| 71 | logo to title | 20 | 16 |
| 72 | title to card | 28 | 16 |
| 73 | CTA to bottom | 35 | 33 |

Card to dots (10) and dots to CTA (20) are already right.

### 8.14 Get started (`NewLoginDesign/NewGetStartedScreen.tsx`)

Covered by items 10, 12, 13 and the measured table in section 7. The gap
between the two buttons (8) is already right.

### 8.15 QR sheet (`NewLoginDesign/QrBottomSheet.tsx`)

Uses three dead classes (`w-xd-260`, `h-xd-260`, `rounded-xd-16`). The sheet's
own numbers are in section 6.

### 8.16 Icon gaps, checked against real text widths

Widths computed from the Quicksand `hmtx` table, so these are exact.

| Row | text ends | icon starts | real gap | code |
|---|---|---|---|---|
| privacy line to shield | 196.1 | 206.6 | **10.5** | `gap-xd-5` / `gap-xd-6` |
| number to SIM icon, outcome screens | 141.1 | 148.6 | **7.5** | `gap-xd-2` plus `ml-2` = 10 |
| number to resend, code screen | 141.1 | 146.0 | **4.9** | `gap-xd-6` (correct) |
| resend to SIM icon | 250.0 | 263.6 | **13.6** | - |
| line 3 to SIM icon | 292.5 | 316 to 322 | **23.6 to 29.6** | `gap-xd-5` |

The last row is the only place the design disagrees with itself: the same icon
on the same row sits at 316.1, 320.1 and 322.1 on three artboards. Use each
screen's own value: phone **28**, method **24**, code **23**.

### 8.17 Wording

Every English label in the code is Title Case. The design file is sentence case,
and sometimes lower case. About 30 strings. A sample:

| XD | code key |
|---|---|
| `login !` | `Login !` |
| `Sign up !` | `Sign Up !` |
| `already registered !` | `Already Registered !` |
| `not registered !` | `Not Registered !` |
| `enter your name !` | `Enter Your Name !` |
| `Enter your phone number registered with us` | `Enter Your Phone Number Registered With Us` |
| `Your privacy is completely safe` | `Your Privacy Is Completely Safe` |
| `I have already account` | `I Have Already Account` |
| `Later, take a look at the app` | `Later, Take A Look At The App` |
| `agree & continue` | `Agree & Continue` |
| `login & Continue` | `Login & Continue` |
| `. quick preview .` | `. Quick Preview .` |
| `send WhatsApp` | `Send WhatsApp` |
| `Send Sms` | `Send SMS` |
| `edit` | `Edit` |

Every rename is a translation key. Each one needs a matching add and remove in
all three of `public/translations/translations.{ar,tr,ku}.js`, and `pnpm lint`
fails on any key missing from the three files.

---

## 9. Decisions taken

The design file wins on every point.

| # | Question | Answer |
|---|---|---|
| 1 | wording | sentence case, exactly as the file |
| 2 | line 2 / 3 weights swapped | follow each screen's own artboards, majority wins (section 4) |
| 3 | success and welcome | split them back: `#D8FFEA` green, `#FFFEF2` purple |
| 4 | `edit` and the resend line | flat `#388CFF` Medium 12, one string, no underline |
| 5 | SIM icon after line 3 | each screen's own gap: 28 / 24 / 23 |
| 6 | not-registered CTA at 790 | use 789 |
| 7 | centred titles 10 px left of centre | true centre. Both are off by the same amount because of the leading `". "`, which is an eyeball, not a spec |
| 8 | `Registration - 1` mixes two designs | take only the sheet. Keep "Trydos", not "RDB" |
| 9 | welcome screen | already built as the `isLogin` branch of `NewSuccessScreen`. Only its colours change |
| 10 | short screens | one uniform scale, never a reshape (ticket A) |

---

## 10. Ticket A — one uniform scale — DONE

**Outcome:** at any viewport the 430 x 932 artboard is drawn whole, at one
scale, with nothing reshaped.

Measured after the change, `/sy-en/loginDemo`. The design canvas is 430 x 932
design px and `--xd-flex-deficit` is `0px` on every one of them, and the first
drawn element sits at the same design position on all of them:

| viewport | scale | canvas drawn | side bar each | canvas top |
|---|---|---|---|---|
| 430 x 932 | 1.0000 | 430 x 932 | 0 | 0 |
| 430 x 745 | 0.7994 | 343.7 x 745 | 43.1 | 0 |
| 390 x 844 | 0.9056 | 389.4 x 844 | 0.3 | 0 |
| 375 x 534 | 0.5730 | 246.4 x 534 | 64.3 | 0 |
| 1024 x 1229 | 1.1628 | 500 x 1083.7 | 262 | 72.6 |
| 1440 x 810 | 0.8691 | 373.7 x 810 | 533.1 | 0 |
| 2560 x 1296 | 1.1628 | 500 x 1083.7 | 1030 | 106.1 |

The live login (`FullEnhancedLoginWidget`) was measured the same way at
430 x 932, 430 x 745, 1024 x 1229 and 2560 x 1296. Its three buttons sit at
design 704.6, 772.6 and 868.6 on all four — the same numbers, which was not
true before.

### Three corrections to this plan, found while building it

1. **Centre against the real window height.** The draft clamped the height
   first, so a window taller than `MAX_H` would centre the canvas in its top
   1200 px instead of in the window.
2. **`MAX_H` can never bind, so it is gone.** `MAX_SCALE` already caps the
   canvas at 500 x 1083.7 px. A 1200 px clamp is unreachable. `FLEX_FREEZE_H`
   went with it — nothing reads it now.
3. **The old landscape branch had no `MAX_SCALE` cap.** On a 2560 x 1440 screen
   it drew the canvas at scale 1.39, which is 598 px wide, past the 500 px limit
   the rest of the system promises. The single formula fixes that.

One more thing the old code hid: `landscapeThreshold` was `vh / vw < 1.7`. A
430-wide phone crosses it as soon as the page is shorter than 731 px, and Safari
gives it 745. The build was 15 px away from switching layout engines in the
middle of portrait. There is no threshold any more.

### A1 Tests first. They must go red before any code changes.

`tests/scaling/canvasFit.test.ts` — new. Extract the maths from the
`useEffect` into a pure function so it can be tested:

```ts
// scaling/canvasFit.ts (new)
export function canvasFit(vw: number, vh: number) {
  const h = Math.min(vh, MAX_H);
  const scale = Math.min(vw / DESIGN_W, h / DESIGN_H, MAX_SCALE);
  return {
    scale,
    left: (vw - DESIGN_W * scale) / 2,
    top: Math.max(0, (h - DESIGN_H * scale) / 2),
  };
}
```

| viewport | expected scale | what the message names |
|---|---|---|
| 430 x 932 | 1 | the design canvas must render 1:1 |
| 430 x 745 | 0.7994 | iPhone Safari with its bars must shrink, not reshape |
| 390 x 844 | 0.9056 | iPhone 13 — height is the tighter limit, so height wins |
| 1440 x 900 | 0.9657 | desktop |
| 2000 x 3000 | 1.1628 | must stop at MAX_SCALE, never over-scale |

Two test files, not one. `tests/scaling/appScaler.test.tsx` is the confirming
test: it mounts the real component and reads back `--app-scale`,
`--xd-flex-deficit` and the canvas box. It was **seen red** against the old
engine on five cases — 430 x 745, 390 x 844, 2000 x 3000, the centring, and the
Safari guard — and is green now. `tests/scaling/canvasFit.test.ts` is a
regression guard over the same maths across thirteen real devices, and was
written green.

`tests/styles/xdUtilities.test.ts` — new. Collect every `xd-*` class used in
`NewLoginDesign/**` and `components/Login/Enhanced/**`, collect every class
defined in `public/styles/xd-utilities.css`, assert the first is a subset of the
second. The message lists the missing names. Red today: five classes.

### A2 to A5

| Step | File | Change | State |
|---|---|---|---|
| A2 | `scaling/canvasFit.ts` (new), `scaling/AppScaler.tsx`, `scaling/Page.tsx` | one `canvasFit` call, no portrait/landscape branches, no `landscapeThreshold` prop. Fixed 430 x 932 box, centred, one `transform: scale()`. `--xd-flex-deficit` pinned to `0px`. Dropped the dead `availHeight / devicePixelRatio` guard. | done |
| A3 | `scaling/scale.config.ts` | `MAX_H` and `FLEX_FREEZE_H` removed. `FLEX_RANGE` kept as a plain `182`, because `QuickPreviewScreen` still divides by it; its shares are inert now and it goes with ticket B. | done |
| A4 | `public/styles/xd-utilities.css` | added the nine classes in section 8.2 | done |
| A5 | `NewLoginDesign/QrBottomSheet.tsx` | see below | done |
| A6 | by hand | the other `<Page variant="scaled">` mounts | live login measured; the four `AuthOverlay` mounts share the same code path and were not opened |

### A5 — the QR sheet had to move with the canvas

`QrBottomSheet` is portaled to `<body>`, outside `#master-canvas`, and sized
itself with `100dvh`. That was the canvas height only while the canvas filled
the window. It does not any more: on iPad Pro portrait and on any window taller
than about 1084 px the canvas stops at `MAX_SCALE` and is centred, so `100dvh`
is far too tall and the sheet would have detached from the page behind it.

`AppScaler` now publishes `--app-canvas-top` and `--app-canvas-height`, and the
sheet is anchored to those instead. Measured after the change: the sheet top is
**35 design px** below the canvas top and its bottom is **exactly on** the canvas
bottom, at 430 x 932, 430 x 745, 1024 x 1229 and 2560 x 1296.

`FlexibleSpace` keeps its API. With the deficit pinned to zero it returns `size`
exactly, so every `share=` value stops mattering without deleting anything.

**Blast radius.** `<Page variant="scaled">` is mounted by `NewLoginWidget`,
`FullEnhancedLoginWidget` (the live login) and `AuthOverlay`. `AuthOverlay` is
used by `ConfirmMobilePhoneWidget`, `SessionExpiredWidget`, `PersonalInfoForm`
and `VerifyUser`. All five should get **better**, because the deficit no longer
squeezes them, but each must be seen, not assumed. There are no tests on
`scaling/` today.

---

## 11. Ticket B — put the screens on the grid — DONE

Measured after the change at 430 x 932, in design px, straight from the browser.
Every number below is the XD number:

| screen | what | XD | measured |
|---|---|---|---|
| phone | close X | (385, 60) 15x15 | (385, 60) 15x15 |
| phone | logo | 116 | 116 |
| phone | title / line 2 / line 3 / line 4 | 288 / 338 / 366 / 389 | 288 / 338 / 366 / 389.1 |
| phone | input | (20, 503) 390x60 | (20, 503) 390x60 |
| phone | flag / icon / plus / number / arrow | 20 / 19.7 / 52 / 65 / right 20 | 20 / 19.7 / 52 / 65 / right 20 |
| method | two buttons | (20, 503) and (217, 503), 193x60 | the same |
| method | icons | 12 in, 10 above | 32 and 229, at 493 |
| method | privacy line | 412 | 412.1 |
| code | six boxes | 20, 86, 152, 218, 284, 350 at 503 | the same |
| code | resend row / privacy | 412 / 435 | 412 / 435.1 |
| outcome | CTA / link | 789 / 879 | 789 / 879 |
| get started | QR icon / logo / title | (375, 60) 25x25 / 390 / 649 | the same |
| get started | buttons / link | 721 / 789 / 879 | the same |
| terms | body / icon / link line | (20, 600) / (202, 688) 25x25 / 721 | the same |
| quick preview | pill / logo / title | 56 (206x30) / 98 / 268 | the same |
| quick preview | card / dots / button | 326 (390x473) / 809 / 837 | the same |
| QR sheet | sheet / handle / code | 90 / (195, 102) 40x2 / (90, 171.5) 250x250 | the same |

### How it was done

Every screen is now `position: absolute` per block, at the design y. Stacking
margins was the reason three screens showed three different gaps for the same
head block, and it is why the whole page sat 15 to 27 px too high even on a
perfect canvas.

`.font-quicksand` carries `line-height: 1.25`, which is exactly
`ascender + descender` for Quicksand. That makes a CSS box top land on the XD
top with no arithmetic, so an anchor is just the number in the file.
`.text-trim` and `.text-trim-descend` are gone — all 45 uses and both class
definitions.

### The wording came out of the file, not out of a guess

`tmp-xdtext.py` read all 55 text strings out of the `.xd` archive with the
artboard each one belongs to, and every rename was taken from that list. 43
keys changed. The new keys are in all three of
`public/translations/translations.{ar,tr,ku}.js`, each reusing the translation
of the key it replaces, because only the English capitalisation moved.

Six strings the flow uses had **never been in the translation files at all** —
`. quick preview .`, `Switch From your App`, the web-account sentence and the
three QR list lines. That was a pre-existing gap in `QuickPreviewScreen` and
`QrBottomSheet`. All six are now translated in all three languages.

`pnpm lint:i18n-parity` is green: 2212 keys in all three files.

### Two places the design file was not followed to the letter

Both are written here rather than hidden:

1. **The countdown on the code screen.** The design shows the whole hint in
   12 Regular `#C3C3C3`, so the timer is grey now too. It used to be bold blue.
   Nothing in the file says the timer is a different colour, so the file won.
2. **The SIM icon on the code screen** should be `#C3C3C3` there and
   `#FBAB2D` on "not registered". Both are `<Image>` files, not inline SVG, so
   the colour cannot be set from the component. Left as they are, and listed
   here as the one visual difference still open.

---

## 11b. Ticket B — the steps as planned

| Step | Files | Change |
|---|---|---|
| B1 | `public/styles/rdb-auth.css` plus 7 screens | add `.font-quicksand { line-height: 1.25 }`. Remove all 45 uses of `text-trim` / `text-trim-descend` and delete the two class definitions. They are used nowhere else. Give the terms body `1.43` and the QR paragraph `1.54`. |
| B2 | new component plus 6 call sites | one dashed border that takes size and colour. The current `.xd-dashed-border` is a fixed 390 x 60 SVG with `#5D5C5D` baked in, stretched by `background-size: 100% 100%`, so it cannot draw a 60 x 60 OTP box or change colour by state. Replace with an inline `<svg>` sized to its box, `stroke="currentColor"`, `stroke-width="0.5"`, `stroke-dasharray="3 3"`. |
| B3 | `NewLoginDesign/authLayout.ts` (new) | the grid from section 3, as one exported object. Every screen reads it. |
| B4 | `NewLoginDesign/AuthLogoSlot.tsx` | stops 116 / 390 / 98. The `share` values and `TOP_FLOOR` go, and the comment block that explains 0.42 and 24 has to be rewritten. |
| B5 | 11 screens in `NewLoginDesign/` | anchor the four blocks at their XD tops. Inside a block, keep flow. This removes `h-1/2 justify-end`, `h-xd-115`, `h-xd-138` and most `FlexibleSpace` uses. |
| B6 | the same screens plus the two `ui/` files | items 5 to 8 and 18 to 73 in section 8 |
| B7 | `NewLoginDesign/NewLoginWidget.tsx` | logo colour map: not-registered ring back to purple, welcome back to purple, success stays green |
| B8 | 6 screens | top-right control to `top-xd-60`. QR icon to 25. `right-xd-30` stays. |
| B9 | 30 keys plus `translations.{ar,tr,ku}.js` | sentence case. Its own commit. `pnpm lint:i18n-parity` must be green before it lands. |
| B10 | `tests/e2e/login-design-parity.live.spec.ts` (new) | walk the flow at 430x932, 430x745 and 390x844 and assert every anchor from `authLayout.ts` within 1 design px |

The parity test uses one `test.step()` per screen and one `expect` per anchor,
each with a message that names the screen, the element and both numbers:

```ts
expect(top, `${screen}: the logo must sit at ${XD.logo.top} design px, it is at ${top}`)
  .toBeCloseTo(XD.logo.top, 0);
```

**Which suite.** `CLAUDE.md` prefers the unit suite because it gates pull
requests and the browser suite does not. The maths is unit-tested in A1. A
rendered position needs real layout, which jsdom does not have, so parity has to
be a browser test. That gap is stated here rather than hidden.

The spec landed as `tests/e2e/login-design-parity.scripted.spec.ts` — scripted,
not live, because the demo route talks to no backend and mints no token. It
walks nine screens at three viewports and checks every anchor against
`NewLoginDesign/authLayout.ts`, the same file the screens read.

**It was seen red.** With `NewEnterPhoneScreen.tsx` put back to its old flow
layout, it failed with:

    the artboard itself, the phone number screen: the close control must have a
    top of 60 design px, it is 30.0

and green on all three viewports with the file restored.

The demo route's step bar got a `data-pw` per step (`demo-step-<id>`) and now
wraps instead of scrolling sideways, because a step scrolled out of a narrow bar
cannot be clicked.

---

## 12. Order, risk and rollback

| Step | Risk | Why |
|---|---|---|
| A1 tests | none | read only |
| A2 scaler | **medium** | six mounting points, including the live login and the profile overlays |
| A3, A4 | low | dead code and missing classes |
| B1 line-height | **medium** | one CSS rule changes every auth text box at once |
| B2 dashed border | low | new component, swapped in one call site at a time |
| B3 to B8 | low each | mechanical, one file at a time, each one checkable |
| B9 wording | **medium** | 30 keys x 4 languages. `pnpm lint` fails on any miss |
| B10 parity test | none | it proves the whole thing |

Ticket A is one commit touching `scaling/`. Ticket B is one commit per screen,
plus one for the wording. Both revert cleanly.

---

## 13. Where the extraction scripts live

Not in the repo. Under the system temp directory, in `xd/` and `measure/`:

- `parse.py` — the full node tree of any artboard
- `spec.py` — every text and box, sorted by y, all 22 artboards
- `full.py` — the same plus icon groups and resolved bounding boxes
- `bbox.py` — the real bounding box of every top-level group
- `width.py` — exact Quicksand advance widths from the `hmtx` table
- `measure/measure.mjs`, `measure/m2.mjs` — the Playwright harness that produced
  section 7

They read the `.xd` file directly, so they can be run again after the design
file changes.
