'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Page from 'scaling/Page';
// The `xd-*` utilities and the `#app-outer` / `#master-canvas` rules the scaled
// canvas relies on live here. Imported so an overlay works even on a page that
// never loaded the login widget.
import 'public/styles/rdb-auth.css';

/**
 * Fullscreen host for an auth surface.
 *
 * The layout matches `FullEnhancedLoginWidget` exactly: one opaque
 * `fixed inset-0` layer that owns the whole viewport, with the 430px design
 * canvas scaled to fit inside it. The canvas is only 430 design-px wide, so on
 * a wide screen there is space left and right of it — that space is painted the
 * same white as the screen inside, which is what makes the surface read as a
 * full page instead of a centred widget.
 *
 * Do not put a dimming backdrop behind this and let the page show through the
 * side space: every screen this hosts (`EnterPhoneScreen`, `EnterPinScreen`,
 * `SessionExpiredScreen`, …) is drawn as a full-page `w-full h-full bg-white`
 * design, and a see-through outer turns it back into a floating column.
 *
 * `#app-outer` gets its own white background from `rdb-auth.css`, so no
 * `outerBg` key is passed here — the default is already the right colour.
 *
 * Always portaled to `document.body`. A `fixed` element is only positioned
 * against the viewport when none of its ancestors set a `transform` (or
 * `filter`/`perspective`/`contain`) — any of those makes that ancestor the
 * containing block instead (CSS spec), and a non-viewport containing block
 * also clips the element to that ancestor's box. `app/(client)/[lang]/settings/
 * template.tsx` wraps every settings route in a Framer Motion `<motion.div>`
 * that keeps an inline `transform` even at rest, plus `overflow-hidden` — so
 * without this portal, mounting `AuthOverlay` under `settings/` puts its
 * `fixed inset-0` layer inside that box instead of covering the screen. This
 * is the second time this exact trap has bitten this codebase (the widget this
 * component replaced portaled to `document.body` for the same reason) — do not
 * remove the portal to "simplify" this component.
 */
export default function AuthOverlay({
    children,
    zIndex = 9999999999999,
}: {
    children: React.ReactNode;
    zIndex?: number;
}) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 w-full h-dvh overflow-hidden bg-white font-quicksand"
            style={{ zIndex }}
        >
            <Page variant="scaled">{children}</Page>
        </div>,
        document.body,
    );
}
