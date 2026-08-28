'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import CustomQRCode from 'components/Login/Enhanced/ui/CustomQRCode';
import FlexibleSpace from 'scaling/FlexibleSpace';
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

                    {/* Bottom Sheet Card anchored in centered max-w-xd-430 canvas */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0.05, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        className="relative z-10 w-full max-w-xd-430 bg-white rounded-t-xd-30 flex flex-col items-start px-xd-35 pb-xd-10 shadow-2xl"
                        style={{
                            borderTopLeftRadius: '30px',
                            borderTopRightRadius: '30px',
                            height: 'calc(100dvh - 35px)',
                        }}
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
                            <h2 className="text-xd-30 font-bold text-[#1D1D1D] tracking-tight leading-tight">
                                {translate('Switch From Your App')}
                            </h2>

                            <div className="w-xd-350 max-w-full">
                                <p className="text-xd-14 text-[#5D5C5D] font-normal mt-xd-12 leading-[1.4]">
                                    &ldquo;{translate('You Can Use Your Account On The Web Securely And Easily.')}&rdquo;
                                </p>
                            </div>

                            <div className="flex flex-col gap-xd-8 mt-xd-12 text-xd-13 text-[#5D5C5D] font-normal leading-[1.5]">
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
