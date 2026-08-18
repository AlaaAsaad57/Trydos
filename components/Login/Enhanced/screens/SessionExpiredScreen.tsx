'use client';

import Image from 'next/image';
import FlexibleSpace from 'scaling/FlexibleSpace';
import { translateFunction } from 'utils/functions';

interface SessionExpiredScreenProps {
    onLogin: () => void;
    onContinueAsGuest: () => void;
    lang?: string;
}

/**
 * The "your session ended" prompt, in the same visual language as
 * `GetStartedScreen`. By the time this renders, /api/auth/expire has already
 * cleared the dead session and registered a fresh guest — the app behind the
 * overlay is usable.
 */
export default function SessionExpiredScreen({
    onLogin,
    onContinueAsGuest,
    lang = 'en',
}: SessionExpiredScreenProps) {
    const translate = (key: string) => translateFunction(key, lang);

    return (
        <main className="w-full h-full bg-white flex flex-col font-quicksand relative">
            <FlexibleSpace size={280} share={0.45} />

            <div className="flex flex-col items-center">
                <Image
                    src="/icons/Logo.svg"
                    alt=""
                    width={144}
                    height={104}
                    priority
                    className="w-xd-144 h-xd-104 object-contain"
                />
            </div>

            <FlexibleSpace size={174} share={0.28} />

            <div className="flex flex-col items-center">
                <h2 className="text-xd-30 font-bold text-[#1D1D1D] h-xd-40 text-center">
                    {translate('Your session has expired')}
                </h2>
                <FlexibleSpace size={24} share={0.04} />

                <div className="w-full flex items-center justify-center">
                    <p className="text-xd-13 leading-[1.6] w-xd-376 text-center font-normal text-[#5D5C5D]">
                        {translate(
                            'Please login again to get back to your account, or continue browsing as a guest.'
                        )}
                    </p>
                </div>

                <FlexibleSpace size={35} share={0.042} />
                <div className="flex py-xd-6 flex-col items-center">
                    <button
                        onClick={onLogin}
                        data-pw="session-expired-login"
                        className="xd-dashed-border w-xd-390 h-xd-60 leading-[1.3] rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {translate('Login')}
                    </button>
                    <button
                        onClick={onContinueAsGuest}
                        data-pw="session-expired-guest"
                        className="xd-dashed-border w-xd-390 h-xd-60 leading-[1.3] rounded-xd-20 bg-[#FCFCFC] text-[#5D5C5D] text-xd-16 mt-xd-8 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        {translate('Continue as Guest')}
                    </button>
                </div>

                <FlexibleSpace size={35} share={0} />
            </div>
        </main>
    );
}
