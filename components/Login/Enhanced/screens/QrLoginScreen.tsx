'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import CustomQRCode from '../ui/CustomQRCode';
import {
    createQrSession,
    getQrStatus,
    isTouchPhone,
    MAX_QR_CODES,
    QR_POLL_MS,
    QrStatusResult,
} from 'services/qrLogin';
import { translateFunction } from 'utils/functions';

interface QrLoginScreenProps {
    /**
     * Called with the request ID once the app approves. It signs this browser
     * in. When it throws, the screen shows "Something went wrong".
     */
    onApproved?: (requestId: string) => Promise<void> | void;
    onClose?: () => void;
    onBack?: () => void;
    onCancel?: () => void;
    variant?: 'floated' | 'fullscreen';
    lang?: string;
}

// An expired code makes a new one by itself (→ 'loading' → 'pending'), up to
// MAX_QR_CODES in a row. After that the screen stops on 'stopped' and waits for
// "Show a new code", so an open tab doesn't make codes for ever.
// 'completing' = the app approved, and this browser is signing in.
type QrStatus =
    | 'loading'
    | 'pending'
    | 'scanned'
    | 'completing'
    | 'rejected'
    | 'stopped'
    | 'error';

interface QrSession {
    linkId: string;
    qrToken: string;
    expiresAt: number;
}

const QR_CARD = '#FCFCFC';

export default function QrLoginScreen({
    onApproved,
    onClose,
    onBack,
    onCancel,
    lang = 'en',
}: QrLoginScreenProps) {
    const handleCancel = onCancel || onClose || onBack;
    const translate = (key: string) => translateFunction(key, lang);

    const [status, setStatus] = useState<QrStatus>('loading');
    const [session, setSession] = useState<QrSession | null>(null);
    const [qrToken, setQrToken] = useState<string>('');
    // Codes made in a row without a scan. Reset by "Show a new code".
    const codesRef = useRef(0);
    // Guards against re-firing completion
    const completedRef = useRef(false);
    // Guards the initial auto-start so React StrictMode's double-mount doesn't create duplicate sessions
    const autoStartedRef = useRef(false);

    // ── Create / regenerate a QR session ──────────────────────────────────────
    const startSession = useCallback(async () => {
        if (codesRef.current >= MAX_QR_CODES) {
            setStatus('stopped');
            return;
        }
        codesRef.current += 1;
        setStatus('loading');
        completedRef.current = false;
        try {
            const data = await createQrSession();
            if (!data?.requestId || !data?.qrPayload) {
                throw new Error('malformed session response');
            }
            setSession({
                linkId: data.requestId,
                qrToken: data.qrPayload,
                expiresAt: data.expiresAt,
            });
            setQrToken(data.qrPayload);
            setStatus('pending');
        } catch {
            setSession(null);
            setStatus('error');
        }
    }, []);

    const showNewCode = () => {
        codesRef.current = 0;
        startSession();
    };

    useEffect(() => {
        if (autoStartedRef.current) return;
        autoStartedRef.current = true;
        startSession();
    }, [startSession]);

    // ── Realtime updates / polling for QR status ──────────────────────────────
    useEffect(() => {
        if (status !== 'pending' && status !== 'scanned') return;
        if (!session?.linkId) return;

        // The next call starts 2 seconds after the last one answered, so only one
        // status call is ever waiting. Overlapping calls could each see
        // "expired" and make two codes.
        let stopped = false;
        let timer: ReturnType<typeof setTimeout>;
        const poll = async () => {
            try {
                const res: QrStatusResult = await getQrStatus(session.linkId);
                if (stopped) return;
                if (res.status === 'expired') {
                    startSession();
                    return;
                }
                if (res.status === 'scanned' && status !== 'scanned') {
                    // Someone scanned, so the code limit starts again.
                    codesRef.current = 0;
                    setStatus('scanned');
                } else if (res.status === 'approved') {
                    if (completedRef.current) return;
                    completedRef.current = true;
                    setStatus('completing');
                    try {
                        await onApproved?.(session.linkId);
                    } catch {
                        setStatus('error');
                    }
                    return;
                } else if (res.status === 'denied') {
                    setStatus('rejected');
                    return;
                }
            } catch (e) {
                if (stopped) return;
                // 403: this browser no longer holds the secret for this code,
                // for example because another tab made a newer code. This code
                // can never sign in here, so make a new one. MAX_QR_CODES still
                // limits it, so two tabs can't take turns for ever.
                if ((e as { status?: number })?.status === 403) {
                    startSession();
                    return;
                }
                // any other failure, such as a network blip — keep polling
            }
            if (!stopped) timer = setTimeout(poll, QR_POLL_MS);
        };
        timer = setTimeout(poll, QR_POLL_MS);

        return () => {
            stopped = true;
            clearTimeout(timer);
        };
    }, [status, session, startSession, onApproved]);

    // Manual retry only for terminal states a user must act on: a phone-side
    // rejection, or a hard error creating/reviving a session. Expiry is handled
    // automatically (regenerate), so it never lands here.
    const showRetry = status === 'rejected' || status === 'error' || status === 'stopped';
    const retryMessage =
        status === 'rejected'
            ? translate('Login was declined on your phone')
            : status === 'stopped'
              ? ''
              : translate('Something went wrong');
    // A phone can't scan its own screen, so phones get a button that opens
    // the same link in the app.
    const showOpenInApp = isTouchPhone() && status === 'pending' && Boolean(qrToken);

    return (
        <div className="w-full h-full flex flex-col bg-white font-quicksand relative">
            {/* Close button */}
            <div className="flex absolute justify-end right-xd-30 top-xd-30 z-10">
                {handleCancel && (
                    <button
                        onClick={handleCancel}
                        data-pw="close"
                        className="w-xd-24 h-xd-24 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        aria-label={translate('Close')}
                    >
                        <Image
                            src="/assets/icons/auth/close.svg"
                            alt="close"
                            width={16}
                            height={16}
                            className="object-contain"
                        />
                    </button>
                )}
            </div>

            <FlexibleSpace size={120} share={0.34} />

            {/* Logo */}
            <div className="hidden flex flex-col items-center">
                <Image
                    src="/icons/logo.svg"
                    alt="RDB Logo"
                    width={120}
                    height={86}
                    className="w-xd-120 h-xd-86 object-contain"
                />
            </div>

            <FlexibleSpace size={34} share={0.06} />

            <div className="flex flex-col items-center px-xd-24">
                <h2 className="text-xd-26 font-bold text-[#1D1D1D] text-center">
                    {translate('Login with QR')}
                </h2>

                <FlexibleSpace size={26} share={0.03} />

                {/* QR card */}
                <div
                    className="relative w-xd-280 h-xd-280 rounded-xd-20 border border-dashed border-[#C3C3C3] flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: QR_CARD }}
                >
                    {/* QR stays on screen once generated. While we wait for the
                        phone to approve (scanned), it's only dimmed — never hidden. */}
                    {(status === 'pending' || status === 'scanned' || status === 'completing') && qrToken && (
                        <div
                            className={`transition-opacity duration-300 ${
                                status === 'pending' ? 'opacity-100' : 'opacity-30'
                            }`}
                        >
                            <CustomQRCode value={qrToken} size={232} bg={QR_CARD} />
                        </div>
                    )}

                    {(status === 'loading' || status === 'completing') && (
                        <span className="w-7 h-7 rounded-full border-2 border-[#388CFF] border-t-transparent animate-spin" />
                    )}

                    {/* Laser scan line sweeping up/down over the dimmed QR until the
                        user confirms on their phone. Mirrors the ID-capture scanner. */}
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
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}

                    {showRetry && (
                        <button
                            onClick={showNewCode}
                            data-pw="qr-show-new-code"
                            className="flex flex-col items-center gap-xd-12 px-xd-24 text-center cursor-pointer"
                        >
                            {retryMessage && (
                                <p className="text-xd-14 font-medium text-[#1D1D1D] leading-[1.4]">
                                    {retryMessage}
                                </p>
                            )}
                            <span className="text-xd-13 text-[#388CFF] underline">
                                {translate('Show a new code')}
                            </span>
                        </button>
                    )}
                </div>

                {showOpenInApp && (
                    <a
                        href={qrToken}
                        data-pw="qr-open-in-app"
                        className="mt-xd-16 text-xd-14 font-medium text-[#388CFF] underline"
                    >
                        {translate('Open in app')}
                    </a>
                )}

                <FlexibleSpace size={26} share={0.03} />

                {status === 'scanned' ? (
                    <p className="text-xd-14 leading-[1.5] w-xd-360 text-center font-medium text-[#1D1D1D]">
                        {translate('Scanned — confirm on your phone to continue')}
                    </p>
                ) : (
                    <p className="text-xd-13 leading-[1.6] w-xd-360 text-center font-normal text-[#5D5C5D]">
                        {translate(
                            'On your phone, open Settings → Linked Devices → Scan, then point the camera at this code.'
                        )}
                    </p>
                )}

            </div>

            <FlexibleSpace grow />
        </div>
    );
}
