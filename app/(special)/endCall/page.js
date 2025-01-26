import MissedIcon from "components/Chat/svg/missedCall.svg";
import "styles/calls.css";
function page() {
  return (
    <div className="call-ended-screen">
      <MissedIcon className="missed-icon-call"></MissedIcon>
      Call Ended.
    </div>
  );
}

export default page;
