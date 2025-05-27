import dynamic from "next/dynamic";
import LandingPage from "./LandingPage";
import { useAppStore } from "store";

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
  const { loginOpen, chatVar: chatOpen } = useAppStore();

  return (
    <>
      {chatOpen && <ChatModal />}
      {loginOpen && <NewLoginWidget />}
    </>
  );
}

export default AuthSections;
