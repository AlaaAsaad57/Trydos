import MissedIcon from "components/Chat/svg/missedCall.svg";
import "styles/calls.css";
export const runtime = "nodejs";

function page() {
  return (
    <div className="call-ended-screen">
      <MissedIcon className="missed-icon-call"></MissedIcon>
      Call Answered from another Account
    </div>
  );
}

export default page;
