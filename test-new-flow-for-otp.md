
There's no test suite, so this is manual via browser DevTools. Run pnpm dev 
1. OTP is hidden from the network
- Open DevTools → Network. Go through login → enter number → pick WhatsApp/SMS.
- ✅ You should see no request to /auth/phone/send_otp and no backend host — only an opaque POST to the current route (the Server Action). The phone is in the action body, but the endpoint/host/proxy headers are gone.

2. Per-number cooldown + button lock
- Send an OTP, land on the PIN screen. Go back to the number step, re-enter the same number.
- ✅ WhatsApp/SMS buttons are dimmed/disabled with a live "Wait Xs before trying again" countdown. Refresh-proof within the tab (sessionStorage); resend on the PIN screen is also blocked.

3. The loop bypass (enter → send → back → re-enter → send …)
- Repeat case 2 several times quickly. ✅ Each same-number attempt stays locked; you can't spam by navigating back.

4. 2-numbers-per-session cap
- Send OTP for number A, then number B (2 distinct allowed). Try a third number C within the hour.
- ✅ Buttons disabled with "Too many verification requests, please try again later." Server returns the same block even if you bypass the UI.

5. Server-side rate limit (the real teeth) — prove the UI isn't the only guard:
- In DevTools console, call the action's effect by scripting sends, or inspect Redis: redis-cli → KEYS otp:*. You'll see otp:sid:…, otp:ip:…, otp:cd:+<number>. ✅ A 3rd distinct number returns blocked server-side.

6. Same-origin proxy guard
- Normal browsing must still work (every market/chat/etc. call carries x-guard; check a /api/proxy request has the header and returns 200).
- From another origin/curl, replay a /api/proxy POST: curl -X POST https://<host>/api/proxy -H "x-proxy-server: market" -H "x-proxy-url: /home/currency".
- ✅ Returns 403 (no/foreign Origin). With a fake -H "Origin: https://evil.com" → still 403. Strip/expire x-guard withe real clientauto-refreshes via /api/guard and retries once.

7. Fail-safe checks (so this can't take the app down):

- Stop Redis → OTP still sends (limiter fails open; backend keeps its own throttle).

One thing I'd watch on first deploy: since /api/proxy is the global fetch path, confirm production traffic 200s righSECRET (the 419 self-healcovers token refresh, but it's worth eyeballing).