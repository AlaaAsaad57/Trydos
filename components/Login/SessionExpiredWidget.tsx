'use client';

import { useCallback } from 'react';
import { useAppStore } from 'store';
import AuthOverlay from './Enhanced/AuthOverlay';
import SessionExpiredScreen from './Enhanced/screens/SessionExpiredScreen';

/**
 * Session-expired prompt for a previously verified shopper whose refresh
 * failed. By the time this renders, /api/auth/expire has already cleared the
 * dead session and registered a fresh guest — the app is usable behind the
 * prompt.
 *
 * Login → hands off to the phone-verify widget ("expired-login" marker, or
 * "seller" on the dashboard); parked 401 requests keep waiting because the
 * marker stays truthy. Continue as Guest → cancels the re-auth wait and
 * reloads (redirects home on seller routes) so the UI drops the stale
 * logged-in state and renders the fresh guest session.
 */
function SessionExpiredWidget() {
    const { language, setShouldAuthinticated, setReAuthResult } = useAppStore();

    // Same seller detection the phone-verify widget's dismiss uses: a guest
    // can't stay on the seller dashboard, so both buttons behave differently.
    const isSeller =
        typeof window !== 'undefined' && window.location.pathname.includes('/seller');

    const handleLogin = useCallback(() => {
        // reAuthResult stays "pending" — the OTP widget owns the outcome now.
        setShouldAuthinticated(isSeller ? 'seller' : 'expired-login');
    }, [setShouldAuthinticated, isSeller]);

    const handleContinueAsGuest = useCallback(() => {
        setReAuthResult('cancelled');
        setShouldAuthinticated(false);
        // Server state already moved to the fresh guest. A guest has no business
        // on the seller dashboard — send them to the storefront; elsewhere
        // reload so server-rendered content stops showing the old account.
        if (isSeller) {
            window.location.href = '/';
            return;
        }
        window.location.reload();
    }, [setReAuthResult, setShouldAuthinticated, isSeller]);

    return (
        <AuthOverlay>
            <SessionExpiredScreen
                onLogin={handleLogin}
                onContinueAsGuest={handleContinueAsGuest}
                lang={language}
            />
        </AuthOverlay>
    );
}

export default SessionExpiredWidget;
