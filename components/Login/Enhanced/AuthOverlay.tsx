'use client';

import React from 'react';
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
    return (
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
        </>
    );
}
