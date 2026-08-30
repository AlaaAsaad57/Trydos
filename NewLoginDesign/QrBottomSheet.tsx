'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import CustomQRCode from 'components/Login/Enhanced/ui/CustomQRCode';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { DESIGN_W } from 'scaling/scale.config';
import { createQrSession, getQrStatus, QrStatusResult } from 'services/qrLogin';
import { translateFunction } from 'utils/functions';

interface QrBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onApproved?: (sessionToken: string) => void;
    lang?: string;
}

type QrStatus = 'loading' | 'pending' | 'scanned' | 'rejected' | 'error';

interface QrSession {
    linkId: string;
    qrToken: string;
    expiresAt: number;
}

const DEFAULT_MOCK_QR = 'trydos://auth/login?session=trydos_secure_qr_session_app_login';

/** Gap between the top of the sheet and the top of the viewport, in design px. */
const TOP_GAP = 35;
/** Corner radius of the sheet, in design px. */
const RADIUS = 30;

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
 * derived from the width; `--app-scale` is not. In landscape, or on a viewport
 * short enough that `AppScaler` freezes the canvas and shrinks it further, the
 * two are different numbers entirely.
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
    // The visible height is the sheet's height, so the design height is that
    // with the scale divided back out.
    height: `calc((100dvh - ${TOP_GAP}px * var(--app-scale, 1)) / var(--app-scale, 1))`,
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
    onApproved,
    lang = 'en',
}: QrBottomSheetProps) {
    const translate = (key: string) => translateFunction(key, lang);

    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState<QrStatus>('pending');
    const [session, setSession] = useState<QrSession | null>(null);
    const [qrToken, setQrToken] = useState<string>(DEFAULT_MOCK_QR);
    const completedRef = useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // ── Create / regenerate a QR session ──────────────────────────────────────
    const startSession = useCallback(async () => {
        setStatus('loading');
        completedRef.current = false;
        try {
            const data = await createQrSession();
            if (data?.requestId && data?.qrPayload) {
                setSession({
                    linkId: data.requestId,
                    qrToken: data.qrPayload,
                    expiresAt: data.expiresAt,
                });
                setQrToken(data.qrPayload);
                setStatus('pending');
            } else {
                setQrToken(DEFAULT_MOCK_QR);
                setStatus('pending');
            }
        } catch {
            setQrToken(DEFAULT_MOCK_QR);
            setStatus('pending');
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            startSession();
        }
    }, [isOpen, startSession]);

    // ── Realtime updates / polling for QR status ──────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        if (status !== 'pending' && status !== 'scanned') return;
        if (!session?.linkId) return;

        const interval = setInterval(async () => {
            try {
                const res: QrStatusResult = await getQrStatus(session.linkId);
                if (res.status === 'expired') {
                    startSession();
                    return;
                }
                if (res.status === 'scanned' && status !== 'scanned') {
                    setStatus('scanned');
                } else if (res.status === 'approved') {
                    if (completedRef.current) return;
                    completedRef.current = true;
                    onApproved?.(session.linkId);
                } else if (res.status === 'denied') {
                    setStatus('rejected');
                }
            } catch {
                // polling retry
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, status, session, startSession, onApproved]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.y > 80 || info.velocity.y > 300) {
            onClose();
        }
    };

    const showRetry = status === 'rejected' || status === 'error';
    const retryMessage =
        status === 'rejected'
            ? translate('Login was declined on your phone')
            : translate('Something went wrong');

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999999999] overflow-hidden font-quicksand flex flex-col justify-end items-center">
                    {/* Fullscreen Dark Dimmed Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#2C2C2C]/85 backdrop-blur-[1px] cursor-pointer"
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
                            height: `calc(100dvh - ${TOP_GAP}px * var(--app-scale, 1))`,
                        }}
                    >
                        <div
                            data-pw="qr-sheet-canvas"
                            style={SCALED_CANVAS}
                            className="flex flex-col items-start px-xd-35 pb-xd-10"
                        >
                            {/* Center Top 2px Pill Handle sitting 12px away from top */}
                            <div className="w-full flex justify-center pt-xd-12">
                                <svg
                                    width="34"
                                    height="2"
                                    viewBox="0 0 34 2"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect width="34" height="2" rx="1" fill="#D1D1D1" />
                                </svg>
                            </div>

                            {/* Top Space to QR */}
                            <FlexibleSpace size={50} share={0.08} />

                            {/* Centered QR Code */}
                            <div className="w-full flex flex-col items-center justify-center">
                                <div className="relative w-xd-260 h-xd-260 flex items-center justify-center">
                                    {qrToken && (
                                        <div
                                            className={`transition-opacity duration-300 ${
                                                status === 'scanned' ? 'opacity-30' : 'opacity-100'
                                            }`}
                                        >
                                            <CustomQRCode value={qrToken} size={260} bg="#FFFFFF" />
                                        </div>
                                    )}

                                    {status === 'loading' && (
                                        <span className="w-8 h-8 rounded-full border-3 border-[#388CFF] border-t-transparent animate-spin absolute" />
                                    )}

                                    {/* Laser scan line */}
                                    {status === 'scanned' && (
                                        <motion.div
                                            className="absolute left-0 right-0 pointer-events-none z-20"
                                            style={{
                                                height: '3px',
                                                background:
                                                    'linear-gradient(90deg, transparent 0%, rgba(56,140,255,0.95) 50%, transparent 100%)',
                                                boxShadow: '0 0 14px 3px rgba(56,140,255,0.6)',
                                            }}
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{
                                                duration: 2.4,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    )}

                                    {showRetry && (
                                        <button
                                            onClick={startSession}
                                            data-pw="qr-show-new-code"
                                            className="flex flex-col items-center gap-xd-12 px-xd-24 text-center cursor-pointer absolute bg-white/95 p-4 rounded-xd-16"
                                        >
                                            <p className="text-xd-14 font-medium text-[#1D1D1D] leading-[1.4]">
                                                {retryMessage}
                                            </p>
                                            <span className="text-xd-13 text-[#388CFF] underline font-medium">
                                                {translate('Show a new code')}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Space between QR and Title */}
                            <FlexibleSpace size={70} share={0.11} />

                            {/* Text Instructions Section */}
                            <div className="w-full flex flex-col items-start">
                                <h2 className="text-xd-30 font-bold text-[#1D1D1D] leading-tight">
                                    {translate('Switch From Your App')}
                                </h2>

                                <div className="w-xd-350 max-w-full">
                                    <p className="text-xd-16 text-[#5D5C5D] font-medium mt-xd-12 leading-[1.4]">
                                        &ldquo;{translate('You Can Use Your Account On The Web Securely And Easily.')}&rdquo;
                                    </p>
                                </div>

                                <div className="flex flex-col gap-xd-8 mt-xd-12 text-xd-14 text-[#5D5C5D] font-normal leading-[1.5]">
                                    <p>- {translate('Open Your Trydos Application')}</p>
                                    <p>- {translate('Choose Switch Web')}</p>
                                    <p>- {translate('Read This Code From Opposite Side Camera')}</p>
                                </div>
                            </div>

                            {/* Expandable spacer to bottom */}
                            <FlexibleSpace grow share={0.65} />

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
                                    {translate('Your Privacy Is Completely Safe')}
                                </span>
                            </div>

                            {/* Bottom Space */}
                            <FlexibleSpace size={30} share={0.05} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
