import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { push, ref, set } from "firebase/database";
import { useStopwatch } from "react-timer-hook";

/* ----------------------------- Local Imports ----------------------------- */
import Recorder from "components/Chat/components/Recorder";
import ChatHeader from "components/Chat/components/ChatHeader";
import ChatMessage from "components/Chat/components/ChatMessage";
import ReplyMessage from "components/Chat/components/ReplyMessage";
import ChatInfo from "components/Chat/components/ChatInfo";
import Observable from "components/Chat/components/ChatHistoryElement";
import WebcamCapture from "components/Chat/components/CameraComponent";
import ChatSearch from "../components/ChatSearch";

import MicIcon from "../svg/mic.svg";
import RedMicIcon from "../svg/redmic.svg";
import WaveIcon from "../svg/wave.svg";
import ShareIcon from "../svg/sharechat.svg";
import PlusIcon from "../svg/chatplus.svg";
import CameraIcon from "../svg/camera.svg";
import SendIcon from "../svg/sendbutton.svg";

import { dataURLtoFile, upload, getUser } from "../chatsFunctions";
import {
  GetChatDetails,
  getMessagesBetweenMessage,
  getPage,
  SendMessage,
} from "store/chat/actions";
import { makeVideoCall, makeVoiceCall } from "store/chat/callActions";
import { showErrorNotification } from "@/store/notifications/reducer";
import { SSRDetect, translateFunction, getUserChat } from "utils/functions";
import { db } from "utils/firebaseInitv1";
import { useAppStore } from "store";

/* -------------------------- Dynamic Components --------------------------- */

/* --------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------*/
interface ConversationContainerProps {
  ViewedScreen: boolean | string;
  active: any; // TODO: replace with accurate chat type
  loading: boolean;
  first: boolean;
  setSearch: (val: string) => void;
  isPrivate: boolean;
  closeWidget: () => void;
}

/* ------------------------------ Constants -------------------------------- */
const FILE_INPUT_ACCEPT = "*/*";

/* --------------------------------------------------------------------------
 * Helper utils – extracted from the spaghetti logic for re-usability & clarity
 * ------------------------------------------------------------------------*/
const buildMessageStatus = (
  receiverId: number | string,
  senderId: number | string
) => [
  {
    is_watched: false,
    is_received: 0,
    user_id: senderId,
  },
  {
    is_received: 0,
    is_watched: false,
    user_id: receiverId,
  },
];

const scrollToBottom = () =>
  document.querySelector("#scroled")?.scrollIntoView({
    block: "end",
    inline: "end",
  });

/* --------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------*/
function ConversationContainer({
  ViewedScreen,
  active,
  loading,
  first,
  setSearch,
  isPrivate,
  closeWidget,
}: ConversationContainerProps) {
  /* ---------------------------------------------------------------------- */
  /* Store hooks                                                            */
  /* ---------------------------------------------------------------------- */
  const {
    callLoading,
    mid,
    AgoraToken,
    openChatRenderer,
    qouted,
    call,
    replyMessage,
    refs,
    activeChat: selectedChat,
    language,
    data: chats,
    setRefs,
    sendMessage,
    watchChannel,
    deleteErrorMessage,
    setQouted,
    setMessagesPage,
    setReplyMessage,
  } = useAppStore();

  /* --------------------------- Derived values --------------------------- */
  const activeChat = isPrivate ? active : selectedChat;
  const receiver = activeChat?.channel_members?.find(
    (m: any) => +m.user_id !== +(getUser() as any)?.id
  );
  const senderId = (getUserChat() as any)?.id;
  const receiverId = receiver?.user_id;
  const receiverRoleId = receiver?.role_id;

  /* ----------------------------- Refs / state ----------------------------- */
  const [vid, setVid] = useState<string | null>(null);
  const [imgs, setImgs] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [mics, setMic] = useState<boolean>(false);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [searchEnable, enableSearch] = useState<boolean>(false);
  const [DetailsVar, openDetails] = useState<boolean>(false);
  const [pendingScrollToMessageId, setPendingScrollToMessageId] = useState<
    string | null
  >(null);
  /* ----------------------------- scroll function ----------------------------- */
  const scrollToMessage = (quoteId) => {
    if (quoteId) {
      if (activeChat?.messages?.filter((f) => f.id === quoteId)?.length > 0) {
        var numb = quoteId?.toString()?.match(/\d/g);
        numb = numb?.join("");
        let el = document.querySelector(`#main-container-${quoteId}`);
        if (el) {
          el.scrollIntoView({ block: "center" });
          setTimeout(() => {
            el.classList.add("backdrop_msg");
          }, 300);
          setTimeout(() => {
            el.classList.remove("backdrop_msg");
          }, 1200);
        }
      }
    }
  };

  const GetMessage = useCallback(
    async (msgId, quoteId) => {
      const found = activeChat?.messages?.some(
        (m) => `${m.id}` === `${quoteId}`
      );
      if (found) {
        requestAnimationFrame(() => scrollToMessage(quoteId));
      } else {
        try {
          await getMessagesBetweenMessage({
            first: activeChat.id,
            second:
              parseInt(activeChat.messages[activeChat.messages.length - 1].id) -
              parseInt(quoteId),
          });
          setQouted(quoteId);
          setPendingScrollToMessageId(quoteId);
        } catch (err) {
          console.error(err);
        }
      }
    },
    [activeChat, setQouted]
  );

  /* ------------------------- Scroll Refs ------------------------------- */
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isFetchingOlderRef = useRef<boolean>(false);
  const prevLastMsgIdRef = useRef<any>(null);

  const imageFile = useRef<HTMLInputElement | null>(null);
  const blobs = useRef<Blob | null>(null);
  const AudioRef = useRef<HTMLAudioElement | null>(null);

  /* --------------------------- Stopwatch hook --------------------------- */
  const { seconds, minutes, start, pause, reset } = useStopwatch({
    autoStart: true,
  });

  /* ---------------------------------------------------------------------- */
  /* Utility callbacks                                                      */
  /* ---------------------------------------------------------------------- */
  const showDuration = () =>
    `${minutes > 9 ? minutes : "0" + minutes}:${
      seconds > 9 ? seconds : "0" + seconds
    }`;

  const sendStatus = useCallback(
    (desc: string | null) => {
      if (!activeChat?.id) return;

      const friendID = receiverId;
      if (!friendID) return;

      const baseRef = ref(
        db,
        `Transaction/${(getUser() as any)?.id}/${friendID}`
      );

      const promise = desc ? push(baseRef, desc) : set(baseRef, null);
      promise.catch(console.error);
    },
    [activeChat?.id, receiverId]
  );

  const handleTyping = useCallback(() => {
    let timer: NodeJS.Timeout | null = null;
    return () => {
      if (timer) clearTimeout(timer);

      const friendID = receiverId;
      if (!friendID) return;

      const path = `Transaction/${(getUser() as any)?.id}/${friendID}`;
      push(ref(db, path), "Typing...").catch(console.error);

      timer = setTimeout(() => {
        set(ref(db, path), null).catch(console.error);
      }, 2000);
    };
  }, [receiverId])();

  /* ---------------------------- Message Utils ---------------------------- */
  const baseMessagePayload = useCallback(
    (overwrite: Partial<any>): any => {
      const base = {
        receiver_user_id: receiverId,
        receiver_role_id: receiverRoleId,
        sender_role_id: (getUser() as any).role_id,
        parent_message_id: replyMessage?.id,
        cid: activeChat.id,
      };
      return { ...base, ...overwrite };
    },
    [receiverId, receiverRoleId, replyMessage?.id, activeChat?.id]
  );

  const optimisticMessage = useCallback(
    (payload: any) => {
      sendMessage({
        isNew:
          typeof activeChat?.id === "string" && activeChat?.id?.includes("ch")
            ? activeChat.id
            : false,
        act: activeChat,
        message: payload,
        isPrivate,
      });
    },
    [sendMessage, activeChat, isPrivate]
  );

  /* ----------------------------- Audio logic ----------------------------- */
  const [isRecording, setRecording] = useState<boolean>(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const onStopRecording = (blob: Blob) => {
    sendStatus(null);
    setMic(false);
    setRecording(false);
    reset();
    setBlobUrl(URL.createObjectURL(blob));
    blobs.current = blob;
  };

  /* ---------------------------- File Handlers ---------------------------- */
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const midLocal = "m" + Math.random().toString().replace(".", "");
    try {
      const file = e.target.files?.[0];
      e.target.value = "";
      e.target.files = null;

      if (!file || !activeChat) return;

      if (file.type.includes("image")) {
        await handleMediaMessage(file, "ImageMessage", midLocal);
      } else if (file.type.includes("audio")) {
        await handleMediaMessage(file, "VoiceMessage", midLocal);
      } else if (file.type.includes("video")) {
        await handleMediaMessage(file, "VideoMessage", midLocal);
      } else {
        await handleMediaMessage(file, "FileMessage", midLocal);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      deleteErrorMessage({ msg_id: midLocal, ch_id: activeChat?.id });
      showErrorNotification(translateFunction("Failed to Upload file"));
      sendStatus(null);
    }
  };

  const handleMediaMessage = async (
    file: File,
    type: string,
    midLocal: string
  ) => {
    try {
      // optimistic UI update (uses base64 for img preview)
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        optimisticMessage({
          ...baseMessagePayload({}),
          sender_user_id: senderId,
          message_type: { name: type },
          message_content: [{ file_path: base64 }],
          message_files: [{ file_path: base64, file_name: file.name }],
          type: "pending",
          created_at: new Date(),
          message_status: buildMessageStatus(receiverId, senderId),
          mid: midLocal,
        });
      };
      reader.readAsDataURL(file);
      // real upload call
      const { path, name } = await upload(file);

      const sendPayload = baseMessagePayload({
        content: [{ file_path: path, file_name: name }],
        message_type: type,
        mid: midLocal,
      });
      // @ts-ignore – original util returns promise
      SendMessage(sendPayload, false, isPrivate);
    } catch (err) {
      console.log("the error is: ", err);
      deleteErrorMessage({ msg_id: midLocal, ch_id: activeChat?.id });
      showErrorNotification(translateFunction("Failed to Upload file"));
    } finally {
      sendStatus(null);
    }
  };

  /* ------------------------------ Text Send ------------------------------ */
  const sendTextMessage = (text: string) => {
    const midLocal = "m" + Math.random().toString().replace(".", "");
    try {
      if (!text.trim()) return;

      const optimistic = {
        ...baseMessagePayload({}),
        sender_user_id: senderId,
        message_type: { name: "TextMessage" },
        message_content: { content: text },
        message_files: [{ file_path: text, file_name: "Text" }],
        created_at: new Date(),
        type: "pending",
        mid: midLocal,
        message_status: buildMessageStatus(receiverId, senderId),
      };
      optimisticMessage(optimistic);

      // actual network
      // @ts-ignore – original util returns promise
      SendMessage(
        baseMessagePayload({
          content: text,
          message_type: "TextMessage",
          mid: midLocal,
        }),
        false,
        isPrivate
      );
    } catch (error) {
      deleteErrorMessage({ msg_id: midLocal, ch_id: activeChat?.id });
      showErrorNotification(translateFunction("Failed to send message"));
      sendStatus(null);
    }
  };

  /* --------------------------- Input handlers --------------------------- */
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendTextMessage(message);
      setMessage("");
      setTimeout(() => (isPrivate ? scrollToBottom() : scrollToBottom()), 500);
    }
  };

  const onChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  /* ------------------------- Scroll & effects --------------------------- */
  useEffect(() => {
    if (first) setTimeout(scrollToBottom, 1000);
  }, [first]);

  useEffect(() => {
    scrollToBottom();
  }, [openChatRenderer]);
  useEffect(() => {
    if (isPrivate) scrollToBottom();
    else scrollToBottom();
    activeChat && activeChat.id && watchChannel(activeChat.id);
  }, [refs]);

  useEffect(() => {
    setSearch("");
  }, [activeChat]);

  useEffect(() => {
    if (pendingScrollToMessageId) {
      const exists = activeChat?.messages?.some(
        (m) => `${m.id}` === `${pendingScrollToMessageId}`
      );
      if (exists) {
        requestAnimationFrame(() => {
          scrollToMessage(pendingScrollToMessageId);
          setPendingScrollToMessageId(null);
        });
      }
    }
  }, [activeChat?.messages, pendingScrollToMessageId]);

  /* ------------------------- Camera permission -------------------------- */
  const enableCamera = (bool: boolean) => {
    if (!bool) return setCameraEnabled(false);

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setCameraEnabled(true))
      .catch(() => {
        setCameraEnabled(false);
        showErrorNotification(
          translateFunction("check camera permissions and refresh")
        );
      });
  };

  /* --------------------------- Date Helpers ----------------------------- */
  const showDate = useCallback(
    (d: any): string => {
      const days = [
        translateFunction("Sunday", language),
        translateFunction("Monday", language),
        translateFunction("Tuesday", language),
        translateFunction("Wednesday", language),
        translateFunction("Thursday", language),
        translateFunction("Friday", language),
        translateFunction("Saturday", language),
      ];
      const now = new Date();
      const nowString = `${now.getFullYear()}-${
        now.getMonth() + 1 > 9 ? now.getMonth() + 1 : "0" + (now.getMonth() + 1)
      }-${now.getDate() > 9 ? now.getDate() : "0" + now.getDate()}`;

      d = new Date(d);
      const dateString = `${d.getFullYear()}-${
        d.getMonth() + 1 > 9 ? d.getMonth() + 1 : "0" + (d.getMonth() + 1)
      }-${d.getDate() > 9 ? d.getDate() : "0" + d.getDate()}`;

      const day = days[new Date(dateString).getDay()];

      if (dateString === nowString) return translateFunction("Today", language);
      if (
        new Date(nowString).getTime() - new Date(dateString).getTime() ===
        86400000
      )
        return translateFunction("Yesterday", language);
      if (
        new Date(nowString).getTime() - new Date(dateString).getTime() <
        86400000 * 6
      )
        return day;
      return language === "ar" ? d.toLocaleString("ar-EG") : dateString;
    },
    [language]
  );

  const showRoute = useCallback(
    (mes: any, prev: any, next: any): string => {
      if (
        prev &&
        (prev.message_content || prev.message_files) &&
        (prev.message_content?.length > 0 || prev.message_files?.length > 0) &&
        (prev.message_content?.[0]?.file_path === "false" ||
          prev.message_files?.[0]?.file_path === "false")
      ) {
        return "lonely";
      }
      let type = "lonely";
      if (
        (!prev && !next) ||
        next?.parent_message ||
        prev?.parent_message ||
        mes?.parent_message
      ) {
        return "lonely";
      }
      if (mes.type === "call") return type;
      if (
        (prev &&
          (mes.sender_user_id !== prev.sender_user_id ||
            (mes.sender_user_id === prev.sender_user_id &&
              prev.type === "call")) &&
          next &&
          mes.sender_user_id === next.sender_user_id &&
          next.sender_user_id !== "call") ||
        (!prev &&
          mes.sender_user_id === next.sender_user_id &&
          next.sender_user_id !== "call")
      ) {
        if (showDate(mes.created_at) === showDate(prev?.created_at))
          type = "first-chat";
      } else if (
        prev &&
        next &&
        mes.sender_user_id === prev.sender_user_id &&
        prev.type !== "call" &&
        mes.sender_user_id === next.sender_user_id &&
        next.sender_user_id !== "call"
      ) {
        if (
          showDate(mes?.created_at) === showDate(prev?.created_at) &&
          showDate(mes?.created_at) === showDate(next?.created_at)
        )
          type = "middle-chat";
      } else if (
        (prev &&
          mes.sender_user_id === prev.sender_user_id &&
          prev.type !== "call" &&
          ((next && mes.sender_user_id !== next.sender_user_id) ||
            !next ||
            next.sender_user_id === "call")) ||
        (next?.parent_message && prev.sender_user_id === mes.sender_user_id)
      ) {
        if (showDate(mes?.created_at) === showDate(prev?.created_at))
          type = "last-chat";
      }
      return type;
    },
    [showDate]
  );

  /* ----------------------- Camera Image Sender -------------------------- */
  const sendCameraImg = useCallback(
    async (imageDataUrl: string) => {
      const midLocal = "m" + Math.random().toString().replace(".", "");
      try {
        optimisticMessage({
          ...baseMessagePayload({}),
          sender_user_id: senderId,
          message_type: { name: "ImageMessage" },
          message_content: [{ file_path: imageDataUrl }],
          message_files: [{ file_path: imageDataUrl, file_name: "Image" }],
          type: "pending",
          created_at: new Date(),
          message_status: buildMessageStatus(receiverId, senderId),
          mid: midLocal,
        });

        const file = dataURLtoFile(imageDataUrl, `image-${midLocal}.jpg`);
        const { path, name } = await upload(file);

        // @ts-ignore – original send util expects certain shape
        SendMessage(
          baseMessagePayload({
            content: [{ file_path: path, file_name: name }],
            message_type: "ImageMessage",
            mid: midLocal,
          }),
          false,
          isPrivate
        );
      } catch (err) {
        console.log(err);
        deleteErrorMessage({ msg_id: midLocal, ch_id: activeChat?.id });
        showErrorNotification(translateFunction("Failed to Upload file"));
      } finally {
        sendStatus(null);
      }
    },
    [
      optimisticMessage,
      baseMessagePayload,
      senderId,
      receiverId,
      isPrivate,
      sendStatus,
    ]
  );

  /* ------------------------- Audio Sender ------------------------------- */
  const sendAudio = useCallback(
    async (midLocal: string) => {
      try {
        if (!blobs.current || !activeChat) return;

        setRecording(false);
        sendStatus(null);
        setMic(false);
        reset();

        // Create file from blob
        const file = new File([blobs.current], `voice-${midLocal}.wav`);

        // Create optimistic message with base64 data
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          optimisticMessage({
            ...baseMessagePayload({}),
            sender_user_id: senderId,
            message_type: { name: "VoiceMessage" },
            message_content: [{ file_path: base64data }],
            message_files: [{ file_path: base64data, file_name: "Audio" }],
            created_at: new Date(),
            type: "pending",
            mid: midLocal,
            message_status: buildMessageStatus(receiverId, senderId),
          });
        };
        reader.readAsDataURL(blobs.current);

        // Upload file and send actual message
        const { path, name } = await upload(file);

        // @ts-ignore – original send util expects certain shape
        SendMessage(
          baseMessagePayload({
            content: [{ file_path: path, file_name: name }],
            message_type: "VoiceMessage",
            mid: midLocal,
          }),
          typeof activeChat?.id === "string" && activeChat?.id?.includes("ch")
            ? activeChat.id
            : false,
          isPrivate
        );
      } catch (error) {
        deleteErrorMessage({ msg_id: midLocal, ch_id: activeChat?.id });
        console.log(error);
        console.error("Error sending audio:", error);
        showErrorNotification(translateFunction("Failed to Upload audio"));
        sendStatus(null);
      }
    },
    [
      blobs,
      activeChat,
      blobUrl,
      setRecording,
      sendStatus,
      setMic,
      reset,
      optimisticMessage,
      baseMessagePayload,
      senderId,
      receiverId,
      isPrivate,
    ]
  );

  /* ------------------------ Fetch Older Helper ------------------------- */
  const fetchOlderMessages = useCallback(() => {
    if (isFetchingOlderRef.current) return;
    if (!active?.id || !active?.messages?.[0]) return;
    prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight || 0;
    isFetchingOlderRef.current = true;
    getPage(active?.id, active?.messages?.[0]?.id);
    setMessagesPage(active?.messages?.[0]?.id);
  }, [active, getPage, setMessagesPage]);

  /* --------------------- Scroll effect for list ------------------------ */
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !activeChat?.messages?.length) return;

    const currentLastMsgId =
      activeChat.messages[activeChat.messages.length - 1]?.id;

    if (isFetchingOlderRef.current) {
      const diff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = diff;
      isFetchingOlderRef.current = false;
    } else if (
      prevLastMsgIdRef.current &&
      currentLastMsgId !== prevLastMsgIdRef.current
    ) {
      container.scrollTop = container.scrollHeight;
    }

    prevLastMsgIdRef.current = currentLastMsgId;
    prevScrollHeightRef.current = container.scrollHeight;
  }, [activeChat?.messages]);

  /* ------------------------- Native Recording --------------------------- */
  const [nativeRecorder, setNativeRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const startNativeRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        onStopRecording(blob);
        setRecordedChunks([]);
        stream.getTracks().forEach((track) => track.stop());
      };

      setRecordedChunks(chunks);
      setNativeRecorder(recorder);
      recorder.start();
      return true;
    } catch (error) {
      console.error("Native recording failed:", error);
      return false;
    }
  }, [onStopRecording]);

  const stopNativeRecording = useCallback(() => {
    if (nativeRecorder && nativeRecorder.state === "recording") {
      nativeRecorder.stop();
      setNativeRecorder(null);
    }
  }, [nativeRecorder]);

  /* ---------------------------------------------------------------------- */
  /* JSX                                                                    */
  /* ---------------------------------------------------------------------- */
  const WebcamCaptureAny = WebcamCapture as any;

  return (
    <>
      {/* hidden file input */}
      <input
        hidden
        accept={FILE_INPUT_ACCEPT}
        style={{ position: "absolute", opacity: 0 }}
        type="file"
        onChange={handleFileChange}
      />

      {/* Camera overlay */}
      {cameraEnabled && (
        <div className="fixed-img-prev">
          <div className="bac-drop" onClick={() => enableCamera(false)} />
          {(() => {
            const webcamProps = {
              imageFile,
              setImgs,
              imgs,
              close: () => enableCamera(false),
              save: setImgs,
              send: (d: string) => {
                sendCameraImg(d);
                enableCamera(false);
              },
            } as any;
            // @ts-ignore runtime prop bag
            return <WebcamCaptureAny {...webcamProps} />;
          })()}
        </div>
      )}

      {/* Image / video preview modal */}
      {(imgs || vid) && (
        <div className="fixed-img-prev" style={{ zIndex: 99999999999999 }}>
          <div className="bac-drop" />
          <div className="svv" onClick={() => (setImgs(null), setVid(null))}>
            {/* close icon (duplicated) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17.828"
              height="17.829"
              viewBox="0 0 17.828 17.829"
            >
              <g transform="translate(-67.032 -2460.283)">
                <line
                  y2="21.213"
                  transform="translate(83.447 2461.697) rotate(45)"
                  fill="none"
                  stroke="#555"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <line
                  y2="21.213"
                  transform="translate(83.447 2476.697) rotate(135)"
                  fill="none"
                  stroke="#555"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </g>
            </svg>
          </div>

          {vid ? (
            <video
              src={vid}
              controls
              className="object-contain h-full w-auto bg-[#0000005d]"
            >
              <source src={vid} />
            </video>
          ) : (
            imgs && (
              <Image
                src={imgs}
                alt="preview"
                fill
                sizes="100vw"
                className="object-contain h-full w-auto bg-[#0000005d]"
              />
            )
          )}
        </div>
      )}

      {/* Recorder component – client-side only */}
      {!nativeRecorder && (
        <Recorder
          blobs={blobs}
          isRecording={isRecording}
          setblobUrl={setBlobUrl}
          onStop={onStopRecording}
        />
      )}

      {/* Main chat layout */}
      <div className="chat-screen" style={{ right: ViewedScreen ? 0 : 431 }}>
        {/* Details Drawer */}
        {DetailsVar && !isPrivate && (
          <ChatInfo
            callLoading={callLoading}
            makeAudioCall={() => {
              if (callLoading || !activeChat?.id) return;
              makeVoiceCall(
                activeChat.id,
                receiver?.user.name,
                receiver?.user?.photo_path,
                receiver?.user.mobile_phone
              );
            }}
            makeVideoCall={() => {
              if (callLoading || !activeChat?.id) return;
              makeVideoCall(
                activeChat.id,
                receiver?.user.name,
                receiver?.user?.photo_path,
                receiver?.user.mobile_phone
              );
            }}
            cancel={() => openDetails(false)}
            activeChat={activeChat}
            enableSearch={() => {
              openDetails(false);
              enableSearch(true);
            }}
          />
        )}

        {/* Header */}
        <ChatHeader
          openDetails={() => {
            openDetails(true);
            GetChatDetails(activeChat?.id);
          }}
          closeWidget={closeWidget}
          chats={chats}
          activeChat={activeChat}
          isPrivate={isPrivate}
        />

        {/* Search */}
        {searchEnable && !isPrivate && (
          <ChatSearch close={() => enableSearch(false)} />
        )}

        {/* Messages */}
        <div ref={scrollContainerRef} className="chat-message-container">
          {!(typeof active?.id === "string" && active?.id?.includes("ch")) &&
            active?.id && (
              <Observable loading={loading} getNext={fetchOlderMessages} />
            )}

          {activeChat?.messages?.map((mes: any, i: number) => (
            <React.Fragment key={mes.id || i}>
              {(showDate(mes.created_at) !==
                showDate(activeChat.messages[i - 1]?.created_at) ||
                !activeChat.messages[i - 1]) && (
                <div className="last-date-value">
                  {showDate(mes.created_at)}
                </div>
              )}
              {/* date separators here – omitted for brevity */}
              <ChatMessage
                isPrivate={isPrivate}
                AudioRef={AudioRef}
                setVid={setVid}
                setImg={() => setImgs(null)}
                GetMessage={(msgId, qoutedId) => {
                  // TODO migrate GetMessage logic to TS

                  GetMessage(msgId, qoutedId);
                }}
                type={showRoute(
                  mes,
                  activeChat.messages[i - 1],
                  activeChat.messages[i + 1]
                )}
                marg={
                  (i !== 0 &&
                    mes.sender_user_id !==
                      activeChat.messages[i - 1]?.sender_user_id) ||
                  mes.message_type.name.includes("Call") ||
                  (i !== 0 &&
                    activeChat.messages[i - 1]?.message_type.name.includes(
                      "call"
                    ))
                }
                message={mes}
              />
            </React.Fragment>
          ))}
          <div id="scroled" style={{ minHeight: 20 }} />
        </div>

        {/* Footer input controls */}
        {mics ? (
          <>
            {replyMessage && (
              <ReplyMessage
                message={replyMessage}
                cancel={() => setReplyMessage(null)}
              />
            )}
            <div className="chat-input-container bac40">
              <MicIcon height={40} style={{ cursor: "pointer" }} />
              <div className="mic-chat">
                <span className="time-mic">{showDuration()}</span>
                <WaveIcon className="wave-svg" />
                <div
                  className="cancel-button"
                  onMouseUp={() => {
                    if (nativeRecorder) {
                      stopNativeRecording();
                    }
                    sendStatus(null);
                    setMic(false);
                    setRecording(false);
                    reset();
                  }}
                >
                  Cancel
                </div>
              </div>
              <ShareIcon
                onClick={() => {
                  if (nativeRecorder) stopNativeRecording();
                  const midLocal =
                    "m" + Math.random().toString().replace(".", "");
                  setRecording(false);
                  setTimeout(() => {
                    sendAudio(midLocal);
                  }, 1500);
                }}
              />
            </div>
          </>
        ) : (
          <>
            {replyMessage && (
              <ReplyMessage
                message={replyMessage}
                cancel={() => setReplyMessage(null)}
              />
            )}
            <div
              className={`${
                message.length > 0 && "pr-[23px]"
              } chat-input-container`}
            >
              <PlusIcon
                style={{ minWidth: 43, cursor: "pointer" }}
                className="chatplus"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[type="file"]')
                    ?.click()
                }
                height={40}
              />
              <div className="input-chat-container">
                <label htmlFor="type" className="no-label">
                  Type
                </label>
                <input
                  id="type"
                  className={`input-chat wid31`}
                  value={message}
                  onChange={onChangeInput}
                  onKeyDown={onKeyDown}
                  onBlur={() => sendStatus(null)}
                />
              </div>
              {message.length > 0 ? (
                <SendIcon
                  style={{ minWidth: 50, cursor: "pointer" }}
                  onClick={() => {
                    sendTextMessage(message);
                    setMessage("");
                  }}
                />
              ) : (
                <>
                  <CameraIcon
                    style={{ minWidth: 50, cursor: "pointer" }}
                    className="camer-icon"
                    onClick={() =>
                      window.innerWidth < 800
                        ? document
                            .querySelector<HTMLInputElement>(
                              'input[type="file"]'
                            )
                            ?.click()
                        : enableCamera(true)
                    }
                  />
                  <RedMicIcon
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      // Try native recording first, fallback to react-record
                      startNativeRecording().then((success) => {
                        if (success) {
                          setMic(true);
                          sendStatus("Recording...");
                          start();
                        } else {
                          // Fallback to react-record (may have lamejs issues)
                          navigator.mediaDevices
                            .getUserMedia({ audio: true })
                            .then(() => {
                              setMic(true);
                              sendStatus("Recording...");
                              start();
                              setRecording(true);
                            })
                            .catch(() => {
                              showErrorNotification(
                                translateFunction("No available Microphone")
                              );
                            });
                        }
                      });
                    }}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default ConversationContainer;
