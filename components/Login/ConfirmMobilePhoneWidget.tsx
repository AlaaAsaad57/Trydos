'use client';

import React, { useEffect } from 'react';
import { useAppStore } from 'store';
import AuthService from 'services/auth';
import { ChatConroller, DisableScroll, EnableScroll } from 'utils/tinyUtils';
import { ORDER_EVENTS, resolveVerifyFlowSource, trackOrder } from 'utils/orderFunnel';
import AuthOverlay from './Enhanced/AuthOverlay';
import VerifyPhoneFlow from './Enhanced/VerifyPhoneFlow';

function ConfirmMobilePhoneWidget() {
    // Per-field selectors: a whole-store destructure would re-render this
    // widget (and re-run its effects) on any unrelated store write while it's
    // mounted over the whole app.
    const setShouldAuthinticated = useAppStore((s) => s.setShouldAuthinticated);
    const shouldAuthinticated = useAppStore((s) => s.shouldAuthinticated);
    const setAddStory = useAppStore((s) => s.setAddStory);
    const setReAuthResult = useAppStore((s) => s.setReAuthResult);
    const expiredSessionPhone = useAppStore((s) => s.expiredSessionPhone);
    const setExpiredSessionPhone = useAppStore((s) => s.setExpiredSessionPhone);
    const language = useAppStore((s) => s.language);

    // Phone preserved when /api/auth/expire cleared the previous session — the
    // fresh guest profile no longer carries it. Only the session-expired
    // re-login markers may use it, so every other flow keeps asking for a phone.
    const savedExpiredPhone =
        shouldAuthinticated === 'expired-login' || shouldAuthinticated === 'seller'
            ? expiredSessionPhone
            : null;

    // Capture the source the verify widget was opened from once, at mount — the
    // store marker is cleared to `false` the moment verification succeeds.
    const flowSourceRef = React.useRef(resolveVerifyFlowSource(shouldAuthinticated));

    useEffect(() => {
        DisableScroll();
        trackOrder(ORDER_EVENTS.VERIFY_FLOW_OPENED, { flow_source: flowSourceRef.current });
        return () => {
            EnableScroll();
        };
    }, []);

    const userData = useAppStore.getState().userProfile;
    const accountPhone =
        userData?.phone !== null &&
        (userData as any)?.phone !== 0 &&
        userData?.phone !== '0'
            ? userData?.phone
            : null;
    const knownPhone = accountPhone || savedExpiredPhone;

    /**
     * Dismissal without verifying: seller routes redirect home (a guest can't
     * use the dashboard); every other flow/route reloads so the page re-renders
     * against whatever token is currently stored — never against stale client
     * state.
     *
     * The navigation is the one guaranteed step: every bit of teardown is
     * best-effort and must never prevent it (a store write can re-render
     * subscribers synchronously — a throw there would otherwise kill this
     * handler before the reload).
     */
    const handleDismiss = () => {
        const isSeller =
            shouldAuthinticated === 'seller' ||
            window.location.pathname.includes('/seller');

        // Clear sub-service tokens via server route. keepalive lets the request
        // survive the navigation below. Skipped when opened from the
        // session-expired prompt — /api/auth/expire already cleared them.
        if (shouldAuthinticated !== 'expired-login') {
            try {
                fetch('/api/auth/clear-tokens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tokens: ['STORIES-TOKEN'] }),
                    credentials: 'include',
                    keepalive: true,
                });
            } catch {}
        }
        try {
            setReAuthResult('cancelled');
            setShouldAuthinticated(false);
        } catch {}

        if (isSeller) {
            window.location.href = '/';
        } else {
            window.location.reload();
        }
    };

    const handleSuccess = () => {
        // Verification succeeded; if this flow was opened from the checkout
        // gate, the user is being returned to checkout.
        if (flowSourceRef.current === 'checkout') {
            trackOrder(ORDER_EVENTS.VERIFY_COMPLETED_RETURNED_TO_CHECKOUT, {
                flow_source: flowSourceRef.current,
            });
        }
        if (shouldAuthinticated === 'open Story') {
            setAddStory(true);
        }
        if (shouldAuthinticated === 'open chat') {
            ChatConroller(true);
        }
        if (savedExpiredPhone) {
            setExpiredSessionPhone(null);
        }
        setShouldAuthinticated(false);
    };

    return (
        <AuthOverlay>
            <VerifyPhoneFlow
                initialPhone={knownPhone}
                phoneLocked={Boolean(knownPhone)}
                verify={(code, verificationId) =>
                    AuthService.VerifyOtp(code, verificationId, '', () => {})
                }
                onSuccess={handleSuccess}
                onClose={handleDismiss}
                lang={language}
                authType="signIn"
            />
        </AuthOverlay>
    );
}

export default ConfirmMobilePhoneWidget;
