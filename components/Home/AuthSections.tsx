import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";

const CallContainer = dynamic(
  () => import("components/Chat/pages/CallContainer"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  loading: () => <LandingPage afterLoad={true} />,
});

// Legacy login widget (kept intact as the fallback while the enhanced flow beds in)
const LegacyLoginWidget = dynamic(
  () => import("components/Login/NewLoginWidget"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);

// Enhanced RDB login widget. Loaded on demand: it pulls in framer-motion, the QR
// stack and `rdb-auth.css`, none of which belong in the first load for a visitor
// who never opens login.
const FullEnhancedLoginWidget = dynamic(
  () => import("components/Login/Enhanced/FullEnhancedLoginWidget"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);

/**
 * Configure active login widget mode:
 * - 'enhanced-fullscreen': RDB UI in full-width / full-screen view (default)
 * - 'legacy': Original floating NewLoginWidget
 */
export type AuthWidgetMode = 'enhanced-fullscreen' | 'legacy';
const CONFIGURED_MODE = process.env.NEXT_PUBLIC_AUTH_WIDGET_MODE as AuthWidgetMode;
// Anything unrecognised falls back to the enhanced widget — a typo in the env
// var must never leave the app with no way to log in.
export const AUTH_WIDGET_MODE: AuthWidgetMode =
  CONFIGURED_MODE === 'legacy' ? 'legacy' : 'enhanced-fullscreen';

function AuthSections() {
  const loginOpen = useAppStore((s) => s.loginOpen);
  const chatOpen = useAppStore((s) => s.chatVar);
  const call = useAppStore((s) => s.call);

  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen &&
        (AUTH_WIDGET_MODE === 'legacy' ? (
          <LegacyLoginWidget />
        ) : (
          <FullEnhancedLoginWidget />
        ))}

      {call && <CallContainer />}
    </>
  );
}

export default AuthSections;
