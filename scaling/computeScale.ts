import {
    DESIGN_H,
    DESIGN_W,
    FLEX_GIVE,
    FLEX_RANGE,
    MAX_SCALE,
    MAX_TABLET_SCALE,
    PHONE_MAX_W,
} from './scale.config';

export type ScaleResult = {
    /** Uniform scale applied to the whole canvas. */
    scale: number;
    /** Height of the un-scaled canvas in design px. */
    canvasHeight: number;
    /** Drawn width of the canvas in CSS px. */
    canvasWidth: number;
    /** Left inset of the drawn canvas in CSS px. */
    offsetX: number;
    /** Top inset of the drawn canvas in CSS px. */
    offsetY: number;
    /** Design px the screen's spacers must give up between them. */
    flexDeficit: number;
};

/**
 * Decide how the 430x932 design canvas is drawn into one viewport.
 *
 * Kept as a pure function, separate from `AppScaler`, because it is the whole
 * of the layout behaviour: every screen in the auth flow is laid out in design
 * px inside this canvas, so one wrong number here moves every element on every
 * screen. `tests/scaling/computeScale.test.ts` pins it to the viewports the
 * real bugs were found on.
 */
export function computeScale(vw: number, vh: number): ScaleResult {
    // Anything wider than a phone has room to spare, so it gets the design at
    // one uniform scale — no gap squeezing at all — capped and centred.
    if (vw > PHONE_MAX_W) {
        const scale = Math.min(vh / DESIGN_H, vw / DESIGN_W, MAX_TABLET_SCALE);
        return {
            scale,
            canvasHeight: DESIGN_H,
            canvasWidth: DESIGN_W * scale,
            offsetX: (vw - DESIGN_W * scale) / 2,
            offsetY: (vh - DESIGN_H * scale) / 2,
            flexDeficit: 0,
        };
    }

    // Phone: the width sets the scale, and the height decides how much of the
    // vertical rhythm has to give.
    const widthScale = Math.min(vw / DESIGN_W, MAX_SCALE);
    const availH = vh / widthScale;

    // What the layout is short of, and how much of that the gaps are allowed to
    // absorb. Whatever is left over is taken by shrinking the whole canvas, so
    // the gaps stay in proportion instead of closing to nothing.
    const shortfall = Math.min(Math.max(0, DESIGN_H - availH), FLEX_RANGE);
    const flexDeficit = Math.min(shortfall, FLEX_RANGE * FLEX_GIVE);

    const canvasHeight = DESIGN_H - flexDeficit;
    const extraScale = Math.min(1, availH / canvasHeight);
    const scale = widthScale * extraScale;

    return {
        scale,
        canvasHeight,
        canvasWidth: DESIGN_W * scale,
        offsetX: (vw - DESIGN_W * scale) / 2,
        offsetY: Math.max(0, (vh - canvasHeight * scale) / 2),
        flexDeficit,
    };
}
