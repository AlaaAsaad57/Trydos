import { useEffect, useRef } from "react";
import { AnswerCall, RefuseCall } from "store/chat/callActions";
import { translateFunction } from "utils/functions";
import "styles/chat.css";
import "styles/chatstyles.css";

import { useParams } from "next/navigation";
import { useAppStore } from "store";
import ChatPhoto from "./ChatPhoto";
import { requestPermissions } from "utils/tinyUtils";
import { showSuccessNotification } from "store/notifications/reducer";
function CallComponent(props) {
  const {
    caller,
    incomeCallData,
    MessageActiveCall,
    language,
    incomeCallType,
    refuseCall,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };

  const ref = useRef();
  var RefAudio;
  useEffect(() => {
    RefAudio = ref;
    return () => {
      RefAudio?.current?.pause();
    };
  }, [ref]);
  const ReplyAction = async (e) => {
    // ask for permissions
    let permissions = await requestPermissions({
      camera: incomeCallType?.toLowerCase() === "video",
      mic: true,
    });
    if (!permissions) {
      showErrorNotification(
        translateFunction(
          "Please enable notification permissions (camera,mic) to use calls features"
        )
      );
      return;
    }
    document.querySelector("#call-rec-id").classList.add("disabled-label");
    e.target.classList.add("disabled-label");
    ref.current.pause();
    ref.current.currentTime = 0;
    setTimeout(() => {
      AnswerCall(incomeCallData.channelId, MessageActiveCall);
      props.reply();
    }, 200);
  };
  return (
    <div className="call-element fixed top-7 right-0 left-0 mr-auto ml-auto mt-0 mb-0 flex flex-row items-start p-3 justify-start bg-slate-100">
      <audio ref={ref} loop autoPlay src={"/default.mp3"}>
        <source src={"/default.mp3"}></source>
      </audio>
      <ChatPhoto width={40} height={40} user={caller} />
      <div className="call-s">
        <span className="incomin">
          {" "}
          {incomeCallType === "audio"
            ? translate("Incoming Voice Call..", language)
            : translate("Incoming Video Call..", language)}{" "}
        </span>
        <span className="call-ss">{caller.channel_name}</span>
      </div>
      <div className="call-options">
        <div
          id="call-rec-id"
          className={"call-rec"}
          onClick={(e) => {
            ReplyAction(e);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <path
              fill="#f7f7f7"
              id="Union_14"
              data-name="Union 14"
              d="M13.458,19.856a22.692,22.692,0,0,1-7.607-5.212A22.621,22.621,0,0,1,.639,7.036c-.852-2.261-.852-4.111,0-4.959.122-.122.245-.253.376-.389C1.786.874,2.678-.051,3.821,0A3.363,3.363,0,0,1,6.188,1.517c2.342,2.911,1.284,3.951.065,5.154l-.218.214c-.2.2-.581,1.126,2.936,4.639a19.652,19.652,0,0,0,2.907,2.5c.5.319,1.371.8,1.736.442l.217-.221c1.2-1.221,2.239-2.273,5.154.069A3.384,3.384,0,0,1,20.5,16.678c.045,1.162-.876,2.038-1.694,2.813-.131.126-.263.249-.385.372a2.7,2.7,0,0,1-1.945.634A8.875,8.875,0,0,1,13.458,19.856Z"
            />
          </svg>
        </div>
        <div
          className={"call-dec "}
          id="call-dec-id"
          onClick={(e) => {
            document
              .querySelector("#call-dec-id")
              .classList.add("disabled-label");
            RefuseCall(incomeCallData.channelId, MessageActiveCall);
            ref.current.pause();
            ref.current.currentTime = 0;
            refuseCall(MessageActiveCall);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 28 26"
          >
            <path
              fill="#f7f7f7"
              id="Union_14"
              data-name="Union 14"
              d="M13.458,19.856a22.692,22.692,0,0,1-7.607-5.212A22.621,22.621,0,0,1,.639,7.036c-.852-2.261-.852-4.111,0-4.959.122-.122.245-.253.376-.389C1.786.874,2.678-.051,3.821,0A3.363,3.363,0,0,1,6.188,1.517c2.342,2.911,1.284,3.951.065,5.154l-.218.214c-.2.2-.581,1.126,2.936,4.639a19.652,19.652,0,0,0,2.907,2.5c.5.319,1.371.8,1.736.442l.217-.221c1.2-1.221,2.239-2.273,5.154.069A3.384,3.384,0,0,1,20.5,16.678c.045,1.162-.876,2.038-1.694,2.813-.131.126-.263.249-.385.372a2.7,2.7,0,0,1-1.945.634A8.875,8.875,0,0,1,13.458,19.856Z"
              transform="matrix(-0.719, 0.695, -0.695, -0.719, 28.986, 14.745)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default CallComponent;
