'use client';

import XdDashedBorder from 'components/Login/Enhanced/ui/XdDashedBorder';
import { DESIGN_W } from 'scaling/scale.config';
import { translateFunction } from 'utils/functions';
import AuthLogoSlot from './AuthLogoSlot';
import { XD, XD_WIDE_LABEL_TRACKING, fromBottom } from './authLayout';

interface NewSessionExpiredScreenProps {
    onLogin: () => void;
    onContinueAsGuest: () => void;
    lang?: string;
}

/** The text runs from the text margin to the same margin on the other side. */
const TEXT_WIDTH = DESIGN_W - 2 * XD.textLeft;

/**
 * "Your session has expired", in the new design (A-26 in UI-MIGRATION-PLAN.md).
 *
 * The XD file has no board for it (D-14: the designer must check it), so it is
 * built like the "already registered !" screen (`NewAlreadyExistScreen`), with
 * its colours: the light blue page, the purple logo at the top, the bold title,
 * one paragraph, the wide dashed button ("Login") and the blue link under it
 * ("Continue as Guest").
 *
 * By the time this shows, /api/auth/expire has already cleared the dead session
 * and registered a fresh guest, so the app behind it is usable.
 */
export default function NewSessionExpiredScreen({
    onLogin,
    onContinueAsGuest,
    lang = 'en',
}: NewSessionExpiredScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    return (
        <div
            data-pw="session-expired"
            className="w-full h-full font-quicksand relative"
            style={{ backgroundColor: '#F4F8FF' }}
        >
            <AuthLogoSlot stop="top" />

            <h2
                className="absolute text-xd-30 font-bold text-[#1D1D1D]"
                style={{ top: XD.head.title, left: XD.textLeft }}
            >
                {translate('Your session has expired')}
            </h2>

            <p
                className="absolute text-xd-16 font-medium text-[#1D1D1D]"
                style={{ top: XD.head.line2, left: XD.textLeft, width: TEXT_WIDTH }}
            >
                {translate(
                    'Please login again to get back to your account, or continue browsing as a guest.',
                )}
            </p>

            <button
                onClick={onLogin}
                data-pw="session-expired-login"
                className="absolute rounded-xd-20 bg-[#FAFAFA] text-[#1D1D1D] text-xd-16 font-normal transition-all active:scale-[0.98] cursor-pointer"
                style={{
                    top: fromBottom(XD.cta.primary),
                    left: XD.box.left,
                    width: XD.box.width,
                    height: XD.box.height,
                    letterSpacing: XD_WIDE_LABEL_TRACKING,
                }}
            >
                <XdDashedBorder
                    width={XD.box.width}
                    height={XD.box.height}
                    radius={XD.box.radius}
                    color="#707070"
                />
                <span className="absolute w-full text-center" style={{ top: 20, left: 0 }}>
                    {translate('Login')}
                </span>
            </button>

            <button
                onClick={onContinueAsGuest}
                data-pw="session-expired-guest"
                className="absolute w-full text-center text-xd-14 font-normal text-[#4D84FF] transition-colors hover:opacity-70 cursor-pointer"
                style={{ top: fromBottom(XD.cta.link), left: 0, letterSpacing: XD_WIDE_LABEL_TRACKING }}
            >
                {translate('Continue as Guest')}
            </button>
        </div>
    );
}
