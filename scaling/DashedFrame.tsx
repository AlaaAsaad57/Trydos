import type React from 'react';

/**
 * DashedFrame — the framed-control outline, drawn exactly as the XD draws it.
 *
 * Every framed control in the design (buttons, the phone field, the six code
 * boxes, the preview card) is a rounded rectangle with a **0.5px stroke and a
 * 3/3 dash**. Two things in the code did not reproduce that:
 *
 *   * A CSS `border: dashed` picks its own dash length from the border width.
 *     At 0.5px that reads as a dotted hairline, not the design's 3px dashes.
 *   * `.xd-dashed-border` baked one 390x60 SVG into a `background-image` with
 *     `background-size: 100% 100%`, so every element of any other size
 *     stretched the dashes. It also hard-codes one grey, while the design uses
 *     six different stroke colours across the screens.
 *
 * Here the stroke is drawn at the element's own pixel size — the <rect> takes
 * its width and height from CSS, not from a viewBox — so a 60x60 code box and
 * a 390x60 button get the identical 3px dash.
 *
 * The old `.xd-dashed-border` class is left alone on purpose: the live auth
 * flow under `components/Login/Enhanced` still uses it, and this pass is not
 * meant to move that flow.
 *
 * Sits behind its content, so the parent needs `relative`.
 */
export default function DashedFrame({
    radius,
    color,
    dashed = true,
    strokeWidth = 0.5,
}: {
    /** Corner radius in design px — the XD `r` of the rectangle. */
    radius: number;
    /** Stroke colour from the XD. */
    color: string;
    /** The preview card is the one framed shape the design draws solid. */
    dashed?: boolean;
    strokeWidth?: number;
}) {
    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
            {/* rx / stroke-width / stroke-dasharray go through `style`, not
                through attributes: an SVG attribute cannot hold a calc(), and
                these have to be expressed in `--xd-unit` so the stroke scales
                with the canvas like everything else. */}
            <rect
                className="xd-frame-rect"
                fill="none"
                stroke={color}
                style={{
                    rx: `calc(${radius} * var(--xd-unit))`,
                    ry: `calc(${radius} * var(--xd-unit))`,
                    strokeWidth: `calc(${strokeWidth} * var(--xd-unit))`,
                    strokeDasharray: dashed
                        ? 'calc(3 * var(--xd-unit)) calc(3 * var(--xd-unit))'
                        : undefined,
                } as React.CSSProperties}
            />
        </svg>
    );
}
