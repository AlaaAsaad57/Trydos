'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Page from 'scaling/Page';
// The `xd-*` utilities and the `#app-outer` / `#master-canvas` rules the scaled
// canvas relies on live here. Imported so an overlay works even on a page that
// never loaded the login widget.
import 'public/styles/rdb-auth.css';

/**
 * Fullscreen host for an auth surface, mirroring the rdb gate treatment
 * (`PasscodeGate`, `SessionTakeoverOverlay`): a dimming backdrop, then the
 * 430px design canvas scaled to fit on top of it.
 *
 * The backdrop is a sibling of `<Page>`, never a child. `#master-canvas` carries
 * `contain: strict; isolation: isolate`, so anything inside the canvas is sealed
 * off from the page behind and cannot dim it.
 *
 * Always portaled to `document.body`. A `fixed` element is only positioned
 * against the viewport when none of its ancestors set a `transform` (or
 * `filter`/`perspective`/`contain`) — any of those makes that ancestor the
 * containing block instead (CSS spec), and a non-viewport containing block
 * also clips the element to that ancestor's box. `app/(client)/[lang]/settings/
 * template.tsx` wraps every settings route in a Framer Motion `<motion.div>`
 * that keeps an inline `transform` even at rest, plus `overflow-hidden` — so
 * without this portal, mounting `AuthOverlay` under `settings/` puts its two
 * `fixed inset-0` layers inside that box instead of covering the screen. This
 * is the second time this exact trap has bitten this codebase (the widget this
 * component replaced portaled to `document.body` for the same reason) — do not
 * remove the portal to "simplify" this component.
 */
export default function AuthOverlay({
    children,
    onBackdropClick,
    zIndex = 9999999999999,
}: {
    children: React.ReactNode;
    /** Omit to make the backdrop inert — the default for a blocking surface. */
    onBackdropClick?: () => void;
    zIndex?: number;
}) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-[#0000004d]"
                style={{ zIndex }}
                onClick={onBackdropClick}
                aria-hidden="true"
            />
            <div className="fixed inset-0 w-full h-dvh font-quicksand" style={{ zIndex: zIndex + 1 }}>
                <Page variant="scaled" outerBg="overlay">
                    {children}
                </Page>
            </div>
        </>,
        document.body,
    );
}
