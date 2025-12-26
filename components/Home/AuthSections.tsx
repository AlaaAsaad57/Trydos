import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";
import CallComponent from "components/Chat/components/CallComponent";
import { ChatConroller } from "utils/tinyUtils";
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
  const { loginOpen, chatVar: chatOpen, call } = useAppStore();

  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen && <NewLoginWidget />}

      {call && <CallContainer />}
    </>
  );
}

export default AuthSections;
