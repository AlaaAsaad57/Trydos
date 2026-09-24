'use client';

import React from 'react';

/**
 * The dashed hairline the whole auth flow is drawn with.
 *
 * XD uses one border everywhere: **0.5 px wide, dash 3 gap 3, aligned inside**,
 * at full opacity. Only the colour changes with the state of the control.
 *
 * Why an SVG and not `border: 0.5px dashed`
 * -----------------------------------------
 * A CSS dashed border does not let you set the dash length. The browser picks
 * it from the border width, so a 0.5px border draws dashes about 1.5px long
 * instead of 3, and the corners of a rounded box are drawn differently again.
 * Next to the XD artboard the difference is obvious.
 *
 * What this replaced
 * ------------------
 * `.xd-dashed-border` in `rdb-auth.css` — a single 390 x 60 SVG with `#5D5C5D`
 * baked into it, stretched to fit with `background-size: 100% 100%`. It could
 * not draw a 60 x 60 code box (the stretch turned the 3px dashes into ovals) and
 * it could not change colour, so every control that needed a state colour fell
 * back to a 1px CSS border instead — which is why the flow had two different
 * borders in it.
 *
 * Sizes are design px. Inside `#master-canvas` one design px is one CSS px and
 * the whole canvas carries a single `transform: scale()`, so the numbers here
 * are exactly the numbers in the design file.
 */
export default function XdDashedBorder({
    width,
    height,
    radius,
    color,
    /** Solid instead of dashed — a filled code box, the quick-preview card. */
    solid = false,
    className = '',
}: {
    width: number;
    height: number;
    radius: number;
    color: string;
    solid?: boolean;
    className?: string;
}) {
    return (
        <svg
            aria-hidden="true"
            className={`absolute top-0 left-0 pointer-events-none ${className}`}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Inset by half the stroke so the line sits inside the box, which
                is what "aligned inside" means in XD. */}
            <rect
                x={0.25}
                y={0.25}
                width={width - 0.5}
                height={height - 0.5}
                rx={Math.max(0, radius - 0.25)}
                stroke={color}
                strokeWidth={0.5}
                strokeDasharray={solid ? undefined : '3 3'}
            />
        </svg>
    );
}
