'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import CustomQRCode from 'components/Login/Enhanced/ui/CustomQRCode';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { DESIGN_H, DESIGN_W } from 'scaling/scale.config';
import { XD } from './authLayout';
import { translateFunction } from 'utils/functions';
import { usePageDir } from 'components/DemoApp1/rtl';

interface QrBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    lang?: string;
}

/**
 * QR login has no backend yet (G-1 in BACKEND-REQUESTS.md). Until it ships the
 * sheet opens as designed with a fixed code that holds plain text, so a camera
 * that scans it opens nothing, and "Soon available" sits in the sheet's message
 * box over the code (A-23 in UI-MIGRATION-PLAN.md). The localStorage mock in
 * `services/qrLogin` is not called from here.
 */
const PLACEHOLDER_QR = 'Trydos';

/**
 * The sheet, from `Registration - 1`.
 *
 * That artboard also carries a set of get-started buttons and the word "RDB",
 * both leftovers from another design. Only the sheet is taken from it.
 */
/** The sheet starts at design y 90, so it leaves 90 above it. */
const TOP_GAP = XD.qrSheet.top;
/** Corner radius of the sheet, in design px. */
const RADIUS = XD.qrSheet.radius;

/**
 * The scaled canvas the sheet's content is laid out in.
 *
 * The sheet is portaled to `document.body`, which puts it outside
 * `#master-canvas` — and that is where the design scale lives. Inside the
 * canvas `--xd-unit` is `1px`, so an `xd-*` class, a `FlexibleSpace` size and a
 * plain `260` all mean the same thing: one design pixel. Out here `--xd-unit`
 * falls back to the `:root` clamp, which is derived from the viewport width, so
 * the `xd-*` classes shrink and every raw number does not. On a 393px phone
 * they drift apart by 9.4%, which is how a 260px QR code ended up overflowing
 * its own `w-xd-260` box by 22px.
 *
 * They also drift apart in kind, not only in amount. `--xd-unit` is always
 * derived from the width; `--app-scale` is the scale that fits the whole
 * artboard, which is limited by the height as often as by the width. On any
 * window taller than about 1084px the two are different numbers entirely.
 *
 * So the content is not laid out in `xd-*` units out here. This rebuilds the
 * canvas contract instead — `--xd-unit: 1px` plus the canvas's own
 * `--app-scale` — and everything inside is then plain design px, exactly as on
 * every other screen.
 *
 * A second `<Page variant="scaled">` is not an option: `AppScaler` hardcodes
 * `#app-outer` and `#master-canvas` as ids and writes `--app-scale` on `:root`,
 * so two of them collide. This reuses the one the login widget already mounted.
 */
const SCALED_CANVAS: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: DESIGN_W,
    // Plain design px: the sheet is the artboard less the gap above it. This
    // box is scaled by `--app-scale` below, so no dvh and no division.
    height: `${DESIGN_H - TOP_GAP}px`,
    // `translateX(-50%)` is measured on the unscaled 430px box and the scale
    // pivots on `top center`, so the two compose to a column 430 * scale wide,
    // centred on the viewport — the same place and size as the canvas behind
    // the backdrop.
    transform: 'translateX(-50%) scale(var(--app-scale, 1))',
    transformOrigin: 'top center',
    ['--xd-unit' as string]: '1px',
};

export default function QrBottomSheet({
    isOpen,
    onClose,
    lang = 'en',
}: QrBottomSheetProps) {
    const translate = (key: string) => translateFunction(key, lang);
    const pageDir = usePageDir();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.y > 80 || info.velocity.y > 300) {
            onClose();
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    // On <body>, outside the login's root, so it sets its own direction.
                    dir={pageDir}
                    className="fixed inset-x-0 z-[99999999999] overflow-hidden font-quicksand flex flex-col justify-end items-center"
                    /* The sheet slides up from the bottom of the CANVAS, not the
                       bottom of the window. On a tall screen the canvas stops at
                       its maximum scale and is centred, so the two are different
                       places and the sheet would otherwise detach from the page
                       behind it. AppScaler publishes both numbers. */
                    style={{
                        top: 'var(--app-canvas-top, 0px)',
                        height: 'var(--app-canvas-height, 100dvh)',
                    }}
                >
                    {/* Fullscreen Dark Dimmed Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 cursor-pointer"
                        style={{ backgroundColor: 'rgba(29, 29, 29, 0.9)' }}
                    />

                    {/* The white sheet spans the whole viewport, like the backdrop
                        under it. Only its content is scaled. */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0.05, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        data-pw="qr-sheet"
                        className="relative z-10 w-full bg-white shadow-2xl overflow-hidden"
                        style={{
                            // The sheet itself is not scaled, so its two design
                            // measurements are multiplied out by hand.
                            borderTopLeftRadius: `calc(${RADIUS}px * var(--app-scale, 1))`,
                            borderTopRightRadius: `calc(${RADIUS}px * var(--app-scale, 1))`,
                            height: `calc(${DESIGN_H - TOP_GAP}px * var(--app-scale, 1))`,
                        }}
                    >
                        <div
                            data-pw="qr-sheet-canvas"
                            style={SCALED_CANVAS}
                            className="relative flex flex-col items-start px-xd-35 pb-xd-10"
                        >
                            {/* The grab handle: 40 x 2 at (195, 102) on the
                                artboard, so 12 below the top of the sheet. */}
                            <div
                                className="absolute"
                                style={{
                                    insetInlineStart: XD.qrSheet.handle.left,
                                    top: XD.qrSheet.handle.top - XD.qrSheet.top,
                                    width: XD.qrSheet.handle.width,
                                    height: XD.qrSheet.handle.height,
                                    borderRadius: XD.qrSheet.handle.height / 2,
                                    backgroundColor: '#C4C2C2',
                                }}
                            />

                            {/* The code: 250 x 250 at (90, 171.5). */}
                            <div className="w-full flex flex-col items-center justify-center">
                                <div
                                    className="absolute flex items-center justify-center"
                                    style={{
                                        insetInlineStart: XD.qrSheet.code.left,
                                        top: XD.qrSheet.code.top - XD.qrSheet.top,
                                        width: XD.qrSheet.code.size,
                                        height: XD.qrSheet.code.size,
                                    }}
                                >
                                    <CustomQRCode
                                        value={PLACEHOLDER_QR}
                                        size={XD.qrSheet.code.size}
                                        bg="#FFFFFF"
                                    />

                                    {/* The sheet's message box (the one the declined
                                        state used), with no "Show a new code" link. */}
                                    <div
                                        data-pw="qr-soon-available"
                                        className="flex flex-col items-center gap-xd-12 px-xd-24 text-center absolute bg-white/95 p-4 rounded-xd-16"
                                    >
                                        <p className="text-xd-14 font-medium text-[#1D1D1D] leading-[1.4]">
                                            {translate('Soon available')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Below the code, which ends at 421.5 on the
                                artboard — 331.5 from the top of the sheet. */}
                            <FlexibleSpace
                                size={XD.qrSheet.code.top - XD.qrSheet.top + XD.qrSheet.code.size + 70}
                            />

                            {/* Text Instructions Section */}
                            <div className="w-full flex flex-col items-start">
                                <h2 className="text-xd-30 font-bold text-[#1D1D1D] leading-tight">
                                    {translate('Switch From your App')}
                                </h2>

                                <div className="w-xd-350 max-w-full">
                                    <p
                                        className="text-xd-13 text-[#5D5C5D] font-normal mt-xd-12"
                                        style={{ lineHeight: XD.qrSheet.paragraphLineHeight }}
                                    >
                                        &ldquo;{translate('You can use your account on the web securely and easily.')}&rdquo;
                                    </p>
                                </div>

                                <div className="flex flex-col gap-xd-8 mt-xd-12 text-xd-14 text-[#1D1D1D] font-normal">
                                    <p>- {translate('Open your Trydos application')}</p>
                                    <p>- {translate('choose Switch web')}</p>
                                    <p>- {translate('read this code from opposite side Camera')}</p>
                                </div>
                            </div>

                            {/* Expandable spacer to bottom */}
                            <FlexibleSpace grow />

                            {/* Bottom Privacy Section */}
                            <div className="w-full flex flex-col items-center justify-center">
                                <div className="w-xd-14 h-xd-14 flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="#388CFF"
                                    >
                                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                                    </svg>
                                </div>
                                <span className="text-xd-11 text-[#388CFF] mt-xd-4 font-normal text-center">
                                    {translate('Your privacy is completely safe')}
                                </span>
                            </div>

                            {/* Bottom Space */}
                            <FlexibleSpace size={30} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
