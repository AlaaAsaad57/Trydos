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
const NewLoginWidget = dynamic(
  () => import("components/Login/NewLoginWidget"),
  {
    loading: () => <LandingPage afterLoad={true} />,
  }
);
function AuthSections() {
  // Per-field selectors: mounted on every page via NavbarClient.
  const loginOpen = useAppStore((s) => s.loginOpen);
  const chatOpen = useAppStore((s) => s.chatVar);
  const call = useAppStore((s) => s.call);

  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen && <NewLoginWidget />}

      {call && <CallContainer />}
    </>
  );
}

export default AuthSections;
