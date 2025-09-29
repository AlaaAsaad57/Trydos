import React, { useEffect } from "react";
import DownArrow from "public/svg/arrow-down.svg";
import UpArrow from "public/svg/arrow-up.svg";
import XIcon from "public/svg/Xicon.svg";
import { DebounceInput } from "react-debounce-input";
import Spinner from "components/global/Spinner";

import { getMessagesBetweenMessage } from "store/chat/actions";
import { GetMessageSearchApi } from "models/API/chat/GetMessagesForSearch";
import { useAppStore } from "store";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";

function ChatSearch({ close }) {
  const {
    searchChat,
    activeChat,
    setChatSearchLoading,
    setChatSearchValue,
    setChatSearchRequest,
    setQouted,
    setChatSearchId,
  } = useAppStore();

  const onChange = (e) => {
    setChatSearchLoading(true);
    setChatSearchValue(e.target.value);

    getMessagesForSearch(e.target.value);
  };
  const getMessagesForSearch = async (value) => {
    if (value?.length > 0) {
      try {
        let response: GetMessageSearchApi = await fetchData({
          url: "/api/v2/elastic/channelSearch",
          server: "chat",
          method: "POST",
          body: JSON.stringify({
            query: value,
            channel_id: parseInt(activeChat.id),
            limit: 100,
            offset: parseInt(searchChat.offset),
          }),
          reqTitle: REQUESTS_DATA.CHANNEL_SERACH,
        });
        // @ts-ignore
        if (!response.success) {
          // @ts-ignore
          throw new Error(response.message);
        }
        let messages = response.data.messages_ids;
        let newOffset = response.data.offset;
        if (response.data.messages_ids?.length > 0) {
          setChatSearchRequest({
            messages,
            newOffset,
          });
          setQouted(
            response.data.messages_ids[response.data.messages_ids.length - 1]
          );
          if (
            activeChat.messages.filter(
              (s) =>
                parseInt(s.id) ===
                response.data.messages_ids[
                  response.data.messages_ids.length - 1
                ]
            ).length > 0
          ) {
          } else
            await getMessagesBetweenMessage({
              first: activeChat?.id,
              second:
                parseInt(
                  activeChat.messages[activeChat.messages.length - 1]?.id
                ) -
                parseInt(
                  response.data?.messages_ids?.[
                    response?.data?.messages_ids?.length - 1
                  ]?.toString()
                ),
            });
          var numb = response.data.messages_ids[
            response.data.messages_ids.length - 1
          ]
            ?.toString()
            ?.match(/\d/g);
          // @ts-ignore
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
        } else {
          setChatSearchLoading(false);
        }
      } catch (err) {
        console.error(err);
        setChatSearchLoading(false);
      }
    }
  };
  const NextSearch = async () => {
    let nextMessageId;
    searchChat.messages.map((s, index) => {
      if (s === searchChat.activeMessage) {
        if (searchChat.messages[index + 1]) {
          nextMessageId = searchChat.messages[index + 1];
        }
      }
      return;
    });

    if (nextMessageId) {
      setQouted(nextMessageId);
      if (
        activeChat.messages.filter((s) => parseInt(s.id) === nextMessageId)
          .length > 0
      ) {
      } else {
        setChatSearchLoading(true);
        await getMessagesBetweenMessage({
          first: activeChat?.id,
          second:
            parseInt(activeChat.messages[activeChat.messages.length - 1]?.id) -
            parseInt(nextMessageId),
        });
      }
      setChatSearchId(nextMessageId);
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
    searchChat.messages.map((s, index) => {
      if (s === searchChat.activeMessage) {
        if (searchChat.messages[index - 1]) {
          prevMessageId = searchChat.messages[index - 1];
        }
      }
    });

    if (prevMessageId) {
      setQouted(prevMessageId);
      if (
        activeChat.messages.filter((s) => parseInt(s.id) === prevMessageId)
          .length > 0
      ) {
      } else {
        setChatSearchLoading(true);
        await getMessagesBetweenMessage({
          first: activeChat?.id,
          second:
            parseInt(activeChat.messages[activeChat.messages.length - 1]?.id) -
            parseInt(prevMessageId),
        });
      }
      setChatSearchId(prevMessageId);
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
    if (searchChat.activeMessage) {
      document
        .querySelector(`#main-container-${searchChat.activeMessage}`)
        ?.scrollIntoView({ block: "center", inline: "center" });
      let el = document.querySelector(
        `#main-container-${searchChat.activeMessage}`
      );
      if (el) {
        el.scrollIntoView({ block: "center" });

        setTimeout(() => {
          el.classList.add("backdrop_msg");
        }, 100);
        setTimeout(() => {
          el.classList.remove("backdrop_msg");
        }, 1000);
      }
      setQouted(null);
    }
  }, [searchChat.activeMessage]);
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
        {searchChat.loading && (
          <Spinner className=" absolute right-2 top-3 z-[99] " />
        )}
        <DebounceInput
          className="w-full text-[#1d1d1d] h-full border-none outline-none absolute top-0 left-0 pl-11 z-10 light rounded-[15px] bg-[#fafafa]"
          minLength={1}
          placeholder="Search"
          value={searchChat.searchValue}
          onChange={(e) => {
            onChange(e);
          }}
          debounceTimeout={300}
        />
      </div>
      <div className="flex ml-2">
        <div
          className={`flex cursor-pointer ${
            searchChat.loading && "opacity-0"
          } ${
            searchChat.activeMessage ===
              searchChat.messages[searchChat.messages.length - 1] && "opacity-5"
          }`}
          onClick={() => {
            if (
              !searchChat.loading &&
              searchChat.activeMessage !==
                searchChat.messages[searchChat.messages.length - 1]
            )
              NextSearch();
          }}
        >
          <DownArrow style={{ transform: "scale(0.8)" }} />
        </div>
        <div
          className={`flex ml-1 cursor-pointer  ${
            searchChat.loading && "opacity-0"
          } ${
            searchChat.activeMessage === searchChat.messages[0] && "opacity-5"
          }`}
          onClick={() => {
            if (
              !searchChat.loading &&
              searchChat.activeMessage !== searchChat.messages[0]
            )
              PreviousSearch();
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
