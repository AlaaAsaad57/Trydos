import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";
import FullEnhancedLoginWidget from "components/Login/Enhanced/FullEnhancedLoginWidget";

const CallContainer = dynamic(
  () => import("components/Chat/pages/CallContainer"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);
const ChatModal = dynamic(() => import("components/Chat/ChatModal"), {
  loading: () => <LandingPage afterLoad={true} />,
});

function AuthSections() {
  const loginOpen = useAppStore((s) => s.loginOpen);
  const chatOpen = useAppStore((s) => s.chatVar);
  const call = useAppStore((s) => s.call);

  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen && <FullEnhancedLoginWidget />}
      {call && <CallContainer />}
    </>
  );
}

export default AuthSections;
