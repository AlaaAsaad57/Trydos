import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";
import "public/styles/rdb-auth.css";

const CallContainer = dynamic(
  () => import("components/Chat/pages/CallContainer"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  loading: () => <LandingPage afterLoad={true} />,
});

// Legacy login widget (kept intact)
// const LegacyLoginWidget = dynamic(
//   () => import("components/Login/NewLoginWidget"),
//   {
//     loading: () => <LandingPage afterLoad={true} />,
//   }
// );

// // Enhanced RDB login widgets
// const EnhancedLoginWidget = dynamic(
//   () => import("components/Login/Enhanced/EnhancedLoginWidget"),
//   {
//     loading: () => <LandingPage afterLoad={true} />,
//   }
// );


import FullEnhancedLoginWidget from "components/Login/Enhanced/FullEnhancedLoginWidget";
/**
 * Configure active login widget mode:
 * - 'enhanced-floated': RDB UI in fixed floated container modal with background scaling
 * - 'enhanced-fullscreen': RDB UI in full-width / full-screen view
 * - 'legacy': Original floating NewLoginWidget
 */
export type AuthWidgetMode = 'enhanced-floated' | 'enhanced-fullscreen' | 'legacy';
export const AUTH_WIDGET_MODE: AuthWidgetMode = (process.env.NEXT_PUBLIC_AUTH_WIDGET_MODE as AuthWidgetMode) || 'enhanced-fullscreen';

function AuthSections() {
  const loginOpen = useAppStore((s) => s.loginOpen);
  const chatOpen = useAppStore((s) => s.chatVar);
  const call = useAppStore((s) => s.call);

  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen && (
        <>
          {/* {AUTH_WIDGET_MODE === 'enhanced-floated' && <EnhancedLoginWidget />} */}
          {AUTH_WIDGET_MODE === 'enhanced-fullscreen' && <FullEnhancedLoginWidget />}
          {/* {AUTH_WIDGET_MODE === 'legacy' && <LegacyLoginWidget />} */}
        </>
      )}

      {call && <CallContainer />}
    </>
  );
}

export default AuthSections;
