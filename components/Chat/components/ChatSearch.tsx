import React, { useEffect } from "react";
import DownArrow from "public/svg/arrow-down.svg";
import UpArrow from "public/svg/arrow-up.svg";
import XIcon from "public/svg/Xicon.svg";
import { DebounceInput } from "node_modules/react-debounce-input/src";
import { useDispatch, useSelector } from "node_modules/react-redux/es";
import Spinner from "components/global/Spinner";
import axios from "node_modules/axios";
import { getMessagesBetweenMessage } from "store/chat/actions";
import { getUserChat } from "utils/functions";

function ChatSearch({ close }) {
  const searchValue = useSelector(
    (state: StateInterface) => state.chat.search.searchValue
  );
  const loading = useSelector(
    (state: StateInterface) => state.chat.search.loading
  );
  const offset = useSelector(
    (state: StateInterface) => state.chat.search.offset
  );
  const activeMessage = useSelector(
    (state: StateInterface) => state.chat.search.activeMessage
  );
  const messages = useSelector(
    (state: StateInterface) => state.chat.search.messages
  );
  const activeChat = useSelector(
    (state: StateInterface) => state.chat.activeChat
  );

  const dispatch = useDispatch();
  const onChange = (e) => {
    dispatch({ type: "CHAT-SEARCH-LOADING", payload: true });
    dispatch({ type: "CHAT-SEARCH-VALUE", payload: e.target.value });
    getMessagesForSearch(e.target.value);
  };
  const getMessagesForSearch = async (value) => {
    let response = await axios.post(
      process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
        "/api/v2/elastic/channelSearch",
      {
        query: value,
        channel_id: parseInt(activeChat.id),
        limit: 100,
        offset: parseInt(offset),
      },
      {
        headers: {
          Authorization: `Bearer ${getUserChat().access_token}`,
        },
      }
    );
    let messages = response.data.messages_ids;
    let newOffset = response.data.offset;
    dispatch({
      type: "CHAT-SEARCH-REQUEST",
      payload: {
        messages,
        newOffset,
      },
    });
    dispatch({
      type: "qouted",
      payload:
        response.data.messages_ids[response.data.messages_ids.length - 1],
    });
    if (
      activeChat.messages.filter(
        (s) =>
          parseInt(s.id) ===
          response.data.messages_ids[response.data.messages_ids.length - 1]
      ).length > 0
    ) {
    } else
      await getMessagesBetweenMessage({
        first: activeChat?.id,
        second:
          parseInt(activeChat.messages[activeChat.messages.length - 1]?.id) -
          parseInt(
            response.data.messages_ids[response.data.messages_ids.length - 1]
          ),
      });
    var numb = response.data.messages_ids[response.data.messages_ids.length - 1]
      ?.toString()
      ?.match(/\d/g);
    numb = numb?.join("");
    let el = document.querySelector(
      `#main-container-${
        response.data.messages_ids[response.data.messages_ids.length - 1]
      }`
    );

    if (el) {
      el.scrollIntoView({ block: "center" });

      setTimeout(() => {
        el.classList.add("backdrop_msg");
      }, 300);
      setTimeout(() => {
        el.classList.remove("backdrop_msg");
      }, 3000);
    }
  };
  const NextSearch = async () => {
    let nextMessageId;
    messages.map((s, index) => {
      if (s === activeMessage) {
        if (messages[index + 1]) {
          nextMessageId = messages[index + 1];
        }
      }
      return;
    });

    if (nextMessageId) {
      dispatch({
        type: "qouted",
        payload: nextMessageId,
      });
      if (
        activeChat.messages.filter((s) => parseInt(s.id) === nextMessageId)
          .length > 0
      ) {
      } else {
        dispatch({ type: "CHAT-SEARCH-LOADING", payload: true });
        await getMessagesBetweenMessage({
          first: activeChat?.id,
          second:
            parseInt(activeChat.messages[activeChat.messages.length - 1]?.id) -
            parseInt(nextMessageId),
        });
      }
      dispatch({ type: "CHAT-SEARCH-ID", payload: nextMessageId });
      var numb = nextMessageId?.toString()?.match(/\d/g);
      numb = numb?.join("");
      let el = document.querySelector(`#main-container-${nextMessageId}`);
      if (el) {
        el.scrollIntoView({ block: "center" });

        setTimeout(() => {
          el.classList.add("backdrop_msg");
        }, 300);
        setTimeout(() => {
          el.classList.remove("backdrop_msg");
        }, 3000);
      }
    }
  };
  const PreviousSearch = async () => {
    let prevMessageId;
    messages.map((s, index) => {
      if (s === activeMessage) {
        if (messages[index - 1]) {
          prevMessageId = messages[index - 1];
        }
      }
    });

    if (prevMessageId) {
      dispatch({
        type: "qouted",
        payload: prevMessageId,
      });
      if (
        activeChat.messages.filter((s) => parseInt(s.id) === prevMessageId)
          .length > 0
      ) {
      } else {
        dispatch({ type: "CHAT-SEARCH-LOADING", payload: true });
        await getMessagesBetweenMessage({
          first: activeChat?.id,
          second:
            parseInt(activeChat.messages[activeChat.messages.length - 1]?.id) -
            parseInt(prevMessageId),
        });
      }
      dispatch({ type: "CHAT-SEARCH-ID", payload: prevMessageId });
      var numb = prevMessageId?.toString()?.match(/\d/g);
      numb = numb?.join("");
      let el = document.querySelector(`#main-container-${prevMessageId}`);
      if (el) {
        el.scrollIntoView({ block: "center" });

        setTimeout(() => {
          el.classList.add("backdrop_msg");
        }, 300);
        setTimeout(() => {
          el.classList.remove("backdrop_msg");
        }, 3000);
      }
    }
  };
  useEffect(() => {
    if (activeMessage) {
      document
        .querySelector(`#main-container-${activeMessage}`)
        ?.scrollIntoView({ block: "center", inline: "center" });
      let el = document.querySelector(`#main-container-${activeMessage}`);
      if (el) {
        el.scrollIntoView({ block: "center" });

        setTimeout(() => {
          el.classList.add("backdrop_msg");
        }, 100);
        setTimeout(() => {
          el.classList.remove("backdrop_msg");
        }, 1000);
      }
      dispatch({ type: "qouted", payload: null });
    }
  }, [activeMessage]);
  return (
    <div className=" z-[99] absolute h-[50px] top-[48px] items-center left-0 w-full bg-[#fafafa] py-2 px-3 flex-row justify-between">
      <div className="flex relative w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="z-20"
          width="25.5"
          height="25.5"
          viewBox="0 0 25.5 25.5"
        >
          <g id="search-3" transform="translate(0.25 0.25)">
            <g
              id="Group_3684"
              data-name="Group 3684"
              transform="translate(17.819 5.414)"
            >
              <g id="Group_3683" data-name="Group 3683">
                <path
                  id="Path_15701"
                  data-name="Path 15701"
                  d="M77.249,111.247a.926.926,0,0,1,1.31,0,6.33,6.33,0,0,1,1.811,5.131.926.926,0,0,1-.921.834c-.031,0-.062,0-.093,0a.926.926,0,0,1-.83-1.014,4.485,4.485,0,0,0-1.277-3.637A.926.926,0,0,1,77.249,111.247Z"
                  transform="translate(-76.978 -110.976)"
                  fill="#388cff"
                />
              </g>
            </g>
            <g
              id="Group_3686"
              data-name="Group 3686"
              transform="translate(3.819 0)"
            >
              <g id="Group_3685" data-name="Group 3685">
                <path
                  id="Path_15702"
                  data-name="Path 15702"
                  d="M10.59,0A10.59,10.59,0,1,1,0,10.59,10.6,10.6,0,0,1,10.59,0Zm0,19.328A8.738,8.738,0,1,0,1.853,10.59,8.747,8.747,0,0,0,10.59,19.328Z"
                  fill="none"
                  stroke="#388cff"
                  strokeWidth="0.5"
                />
              </g>
            </g>
            <g
              id="Group_3688"
              data-name="Group 3688"
              transform="translate(0 16.417)"
            >
              <g id="Group_3687" data-name="Group 3687">
                <path
                  id="Path_15703"
                  data-name="Path 15703"
                  d="M336.98,343.712l6.731-6.731a.926.926,0,0,1,1.31,1.31l-6.731,6.731a.926.926,0,1,1-1.31-1.31Z"
                  transform="translate(-336.708 -336.71)"
                  fill="none"
                  stroke="#388cff"
                  strokeWidth="0.5"
                />
              </g>
            </g>
          </g>
        </svg>
        {loading && <Spinner className=" absolute right-2 top-3 z-[99] " />}
        <DebounceInput
          className="w-full h-full border-none outline-none absolute top-0 left-0 pl-11 z-10 light rounded-[15px] bg-[#fafafa]"
          minLength={1}
          placeholder="Search"
          value={searchValue}
          onChange={(e) => {
            onChange(e);
          }}
          debounceTimeout={300}
        />
      </div>
      <div className="flex ml-2">
        <div
          className={`flex cursor-pointer ${loading && "opacity-0"} ${
            activeMessage === messages[messages.length - 1] && "opacity-5"
          }`}
          onClick={() => {
            if (!loading && activeMessage !== messages[messages.length - 1])
              NextSearch();
          }}
        >
          <DownArrow style={{ transform: "scale(0.8)" }} />
        </div>
        <div
          className={`flex ml-1 cursor-pointer  ${loading && "opacity-0"} ${
            activeMessage === messages[0] && "opacity-5"
          }`}
          onClick={() => {
            if (!loading && activeMessage !== messages[0]) PreviousSearch();
          }}
        >
          <UpArrow style={{ transform: "scale(0.8)" }} />
        </div>
        <div
          className="flex ml-1 cursor-pointer"
          onClick={() => {
            close();
          }}
        >
          <XIcon style={{ transform: "scale(0.8)" }} />
        </div>
      </div>
    </div>
  );
}

export default ChatSearch;
