/**
 * The design grid, straight out of the XD file.
 *
 * Every number is design px, measured from the top-left of the 430 x 932
 * artboard. Inside `#master-canvas` one design px is one CSS px, and AppScaler
 * draws the whole artboard at one scale, so a screen can place a block with a
 * plain `top: XD.head.title` and it lands exactly where the designer put it, on
 * every device.
 *
 * Read the numbers here and nowhere else. Before this file each screen wrote
 * its own margins, and the same head block ended up on three different lines on
 * three screens because `mt-xd-10` on one was `pt-xd-12` on another.
 *
 * How the vertical numbers were read out of the file: a text node with
 * `frame.type = "positioned"` stores its BASELINE in `y`, not its top. Quicksand
 * has an ascender of exactly 1.0 em, so top = baseline - fontSize. Every number
 * below is already a top edge, and `.font-quicksand` carries `line-height: 1.25`
 * so a CSS box top lands on the same edge.
 *
 * See docs/login-design-xd-parity.md for how the file was read and for the
 * artboard each number came from.
 */

/**
 * A design y that keeps its distance from the BOTTOM of the real page.
 *
 * The artboard is 932 tall, but a page in Safari on an iPhone is about 745:
 * the browser bars take the rest. AppScaler fills the width anyway and
 * publishes the missing height as `--xd-flex-deficit` (design px, 0 on a full
 * screen). An element placed with `fromBottom(y)` moves up by that amount, so
 * the buttons and the link stay above the browser bar and the big empty space
 * above the mark is what gets shorter. A plain `top: y` stays where it is.
 *
 * Which elements use it: everything from the mark's low resting place
 * (`logo.centre`) down on Get Started and Terms, and the CTA cluster (`cta.*`)
 * everywhere. The head block, the input row and the corner controls never do.
 */
export const fromBottom = (top: number) => `calc(${top}px - var(--xd-flex-deficit, 0px))`;

export const XD = {
    /** The artboard. Also the size of the canvas AppScaler draws. */
    canvas: { width: 430, height: 932 },

    /** The single control in the top-right corner. Both sit 30 in from the right. */
    control: {
        top: 60,
        right: 30,
        /** The close "X" on the six screens that can be dismissed. */
        closeSize: 15,
        /** The "scan a QR code" icon on Get Started. */
        qrSize: 25,
    },

    /** The badge mark. 150 x 150 wherever it appears. */
    logo: {
        size: 150,
        /** Phone, method, code and all four outcome screens. */
        top: 116,
        /** Get Started and Terms — the mark sits low, buttons under it. */
        centre: 390,
        /** Quick preview, under the slogan pill. */
        quickPreview: 98,
    },

    /**
     * The head block. Four lines, each anchored on its own, because the design
     * does not space them evenly and a stack of margins cannot reproduce that.
     */
    head: {
        /** 30 Bold #1D1D1D */
        title: 288,
        /** 16 */
        line2: 338,
        /** 12 */
        line3: 366,
        /** 11 #4A31E7 — the privacy line. */
        line4: 389,
        /** The method and code screens add a row above it, so line 4 moves. */
        line4WithRow: 412,
        /** The expired-code screen pushes it once more. */
        line4Expired: 435,
    },

    /** Text starts at 40. Boxes start at 20 and are 390 wide. Nothing uses 30. */
    textLeft: 40,

    /** Every wide input and every button. */
    box: {
        left: 20,
        width: 390,
        height: 60,
        radius: 20,
        /** Phone input, method row, code row. */
        top: 503,
        /** The code row lifts on the wrong and expired screens. */
        topLifted: 493,
    },

    /** Six boxes, 20 to 410. */
    otp: { size: 60, gap: 6, radius: 15 },

    /** Two buttons at x 20 and x 217. */
    method: {
        width: 193,
        gap: 4,
        /** The icon straddles the top border: 12 in, 10 above. */
        iconSize: 20,
        iconLeft: 12,
        iconAbove: 10,
    },

    /** The message under the code row on the wrong and expired screens. */
    otpMessageTop: 561,

    /** Nothing interactive may sit below this line — the keyboard starts here. */
    keyboardTop: 583,

    /** The bottom of every screen. */
    cta: {
        /** The upper of the two buttons, where a screen has two. */
        second: 721,
        /** The main button. */
        primary: 789,
        /** The 14px link under it. */
        link: 879,
    },

    /** Get Started only. */
    getStarted: { title: 649 },

    /** Terms only. */
    terms: {
        body: 600,
        bodyLineHeight: 1.43,
        icon: { left: 202, top: 688, size: 25 },
        linkLine: 721,
    },

    /** Quick preview only. */
    quickPreview: {
        /**
         * The slogan pill. The design draws it as a positioned text with 12px
         * of pill on each side, so the pill hugs its own line: 206 wide for
         * '. Your new shopping buddy .', a different width for every other
         * slogan. There is no fixed width to copy.
         */
        pill: { top: 56, paddingX: 12, height: 30, radius: 12 },
        logo: 98,
        title: 268,
        card: { top: 326, height: 473 },
        dots: { top: 809, step: 14, gap: 6, activeWidth: 16, size: 8 },
        button: 837,
    },

    /** The QR sheet, from `Registration - 1`. */
    qrSheet: {
        top: 90,
        radius: 30,
        handle: { left: 195, top: 102, width: 40, height: 2 },
        code: { left: 90, top: 171.5, size: 250 },
        paragraphLineHeight: 1.54,
    },
} as const;

/**
 * Icon gaps after the third line.
 *
 * The icon follows the sentence with a gap, not a fixed x, because the sentence
 * is translated and its length changes. Each gap is the icon's left in the
 * design file minus the text's left (40) minus the width the browser draws the
 * English sentence at, measured in Chromium with the shipped Quicksand files:
 * 257 for "We will send..." and 263 for "We have sent...", at 12px, the same
 * at Regular and Medium. The font's `hmtx` table gave 5px less than that, which
 * is why the first numbers here put every icon 5px right of the design.
 *
 * This is the one place the design file disagrees with itself: the same SIM
 * icon on the same row sits at 320.1 (phone), 316.1 (method) and 322.1 (code)
 * on three artboards. Each screen keeps its own number rather than an average,
 * because an average is wrong on all three.
 */
/**
 * The one bit of letter spacing in the whole file.
 *
 * XD sets `letterSpacing: 10` on exactly three labels — "login & Continue",
 * "Create new account & Continue" and "Cancel & take a look at the app". XD
 * counts in 1/1000 em, so 10 is 0.01em. Everything else in the flow is 0.
 */
export const XD_WIDE_LABEL_TRACKING = '0.01em';

export const XD_LINE3_ICON_GAP = {
    phone: 23.1,
    method: 19.1,
    code: 19.1,
} as const;

/**
 * The gap after a phone number written as "+90 552 800 200 0", which the
 * browser draws 102 wide at 12px. The info icon sits at 148.6 on the two
 * outcome artboards (`Registration - 25`, `- 26`): 148.6 - 40 - 102.
 */
export const XD_PHONE_ICON_GAP = 6.6;
