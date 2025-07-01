import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";
import CallComponent from "components/Chat/components/CallComponent";
import { ChatConroller } from "utils/tinyUtils";
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
  const { loginOpen, chatVar: chatOpen , isCallIncoming } = useAppStore();

  return (
    <>
      {isCallIncoming && <CallComponent reply={() => ChatConroller(true)} isCallIncoming={isCallIncoming}/>}
      {chatOpen && <ChatModal />}
      {loginOpen && <NewLoginWidget />}
    </>
  );
}

export default AuthSections;
