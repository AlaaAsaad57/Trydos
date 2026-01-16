import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from "react";
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
import { dataURLtoFile, upload, getUser } from "../chatsFunctions";
import {
  GetChatDetails,
  getMessagesBetweenMessage,
  getPage,
  SendMessage,
} from "store/chat/actions";
import { makeVideoCall, makeVoiceCall } from "store/chat/callActions";
import { showErrorNotification } from "@/store/notifications/reducer";
import { translateFunction, getUserChat } from "utils/functions";
import { db } from "utils/firebaseInitv1";
import { useAppStore } from "store";
import { requestPermissions } from "@/utils/tinyUtils";
import { ImageCropWidget } from "components/global/ImageCropWidget";
import CustomPopup from "components/global/Popup";
import ChatImagePreviewBeforeSend from "../components/ChatImagePreviewBeforeSend";
import MediaMessagePreview from "../components/MediaMessagePreview";
import { Message } from "utils/types/chat";

/* -------------------------- Dynamic Components --------------------------- */

/* --------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------*/
interface ConversationContainerProps {
  ViewedScreen: boolean | string;
  loading: boolean;
  first: boolean;
  setSearch: (val: string) => void;
  isPrivate?: number | string | null;
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
    openChatRenderer,
    replyMessage,
    refs,
    activeChat: active,
    language,
    data: chats,
    sendMessage,
    watchChannel,
    deleteErrorMessage,
    setQouted,
    setMessagesPage,
    setReplyMessage,
  } = useAppStore();

  /* --------------------------- Derived values --------------------------- */
  const activeChat = active;
  const receiver = activeChat?.channel_members?.find(
    (m: any) => +m.user_id !== +(getUser() as any)?.id
  );
  const senderId = (getUserChat() as any)?.id;
  const receiverId = receiver?.user_id;

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
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(
    null
  );
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
            second: parseInt(sortedMessages?.[0].id) - parseInt(quoteId),
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
        parent_message_id: replyMessage?.id,
        cid: activeChat.id,
      };
      return { ...base, ...overwrite };
    },
    [receiverId, replyMessage?.id, activeChat?.id]
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
        // Show preview widget for images
        setPendingImageFile(file);
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
          parent_message: replyMessage,
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
        parent_message: replyMessage,
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
    scrollToBottom();
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
  const enableCamera = async (bool: boolean) => {
    if (!bool) return setCameraEnabled(false);

    let permission_granted = await requestPermissions({
      camera: true,
      mic: false,
    });
    if (permission_granted) setCameraEnabled(true);
    else {
      showErrorNotification(
        translateFunction(
          "Please enable camera permissions to use camera features"
        )
      );
    }
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
      return dateString;
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
  const sendCameraImg = useCallback((imageDataUrl: string) => {
    // Convert data URL to File and show preview/crop widget
    const file = dataURLtoFile(imageDataUrl, `camera-image-${Date.now()}.jpg`);
    setPendingImageFile(file);
  }, []);

  /* ----------------------- Image Preview Handlers ----------------------- */
  const handleImageCropSave = useCallback((croppedFile: File) => {
    setCroppedImageFile(croppedFile);
    // Create preview URL for the cropped image
    const reader = new FileReader();
    reader.onloadend = () => {
      setCroppedImagePreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
  }, []);

  const handleImagePreviewCancel = useCallback(() => {
    setPendingImageFile(null);
    setCroppedImageFile(null);
    setCroppedImagePreview(null);
  }, []);

  const handleImagePreviewSend = useCallback(async () => {
    if (!croppedImageFile || !activeChat) return;

    const midLocal = "m" + Math.random().toString().replace(".", "");
    try {
      handleMediaMessage(croppedImageFile, "ImageMessage", midLocal);
      setCroppedImageFile(null);
      setCroppedImagePreview(null);
      setPendingImageFile(null);
    } catch (error) {
      console.error("Error sending cropped image:", error);
      deleteErrorMessage({ msg_id: midLocal, ch_id: activeChat?.id });
      showErrorNotification(translateFunction("Failed to Upload file"));
      sendStatus(null);
      setCroppedImageFile(null);
      setCroppedImagePreview(null);
    }
  }, [croppedImageFile, activeChat, handleMediaMessage, sendStatus]);

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
            parent_message: replyMessage,
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
        stream.getTracks().forEach((track) => track.stop());
      };
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
  const isBlockedEachOther = () => {
    if (!activeChat || !receiverId) return false;
    if (activeChat?.channel_members?.some((m: any) => m.is_blocked === 1)) {
      return true;
    }
    return false;
  };
  const [showMenu, setShowMenu] = useState(false);
  const sortedMessages = [...(activeChat?.messages || [])].sort((a, b) => {
    // Use .getTime() to get the numeric Unix timestamp
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  return (
    <>
      {/* hidden file input */}
      <input
        hidden
        accept={FILE_INPUT_ACCEPT}
        onFocus={() => {
          sendStatus("Sending file...");
        }}
        style={{ position: "absolute", opacity: 0 }}
        type="file"
        onBlur={() => {
          sendStatus(null);
        }}
        onChange={handleFileChange}
      />

      {/* Image Preview Widget with Crop */}
      {pendingImageFile && !croppedImageFile && (
        <ImageCropWidget
          image={pendingImageFile}
          onSave={handleImageCropSave}
          onClose={handleImagePreviewCancel}
        />
      )}

      {/* Cropped Image Preview with Send/Cancel buttons */}
      {croppedImageFile && croppedImagePreview && (
        <ChatImagePreviewBeforeSend
          croppedImagePreview={croppedImagePreview}
          handleImagePreviewCancel={handleImagePreviewCancel}
          handleImagePreviewSend={handleImagePreviewSend}
        />
      )}

      {/* Camera overlay */}
      {cameraEnabled && (
        <div className="fixed top-0 left-0 w-full h-full bg-transparent flex flex-col items-center justify-start p-5 z-[9999999999]">
          <div
            className="absolute top-0 left-0 w-full h-full bg-[#585751] opacity-60 z-[9999]"
            onClick={() => enableCamera(false)}
          />
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
        <MediaMessagePreview
          imgs={imgs}
          setImgs={setImgs}
          setVid={setVid}
          vid={vid}
        />
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
              if (isBlockedEachOther()) {
                showErrorNotification(
                  translateFunction(
                    "You cannot send messages or calls to this user",
                    language
                  )
                );
                return;
              }
              if (callLoading || !activeChat?.id) return;
              makeVoiceCall(
                activeChat.id,
                receiver?.user.name,
                receiver?.user?.photo_path,
                receiver?.user.mobile_phone
              );
            }}
            makeVideoCall={() => {
              if (isBlockedEachOther()) {
                showErrorNotification(
                  translateFunction(
                    "You cannot send messages or calls to this user",
                    language
                  )
                );
                return;
              }
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
          isBlockedEachOther={isBlockedEachOther()}
          openDetails={() => {
            openDetails(true);
            GetChatDetails(activeChat?.id);
          }}
          closeWidget={closeWidget}
          chats={chats}
          activeChat={activeChat}
          isPrivate={isPrivate}
          close={() => {
            enableSearch(false);
          }}
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

          {sortedMessages?.map((mes: Message, i: number) => (
            <React.Fragment key={mes.id || i}>
              {(showDate(mes.created_at) !==
                showDate(sortedMessages?.[i - 1]?.created_at) ||
                !sortedMessages?.[i - 1]) && (
                <div className="last-date-value">
                  {showDate(mes.created_at)}
                </div>
              )}
              {/* date separators here – omitted for brevity */}
              <ChatMessage
                auth_message_status={mes.auth_message_status}
                created_at={mes.created_at}
                duration_in_seconds={mes.duration_in_seconds}
                id={mes.id}
                is_forward={mes.is_forward}
                message_content={mes.message_content}
                message_files={mes.message_files}
                message_status={mes.message_status}
                message_type={mes.message_type}
                parent_message={mes.parent_message}
                parent_message_id={mes.parent_message_id}
                sender_user_id={mes.sender_user_id}
                mid={mes?.mid}
                isPrivate={isPrivate}
                setVid={setVid}
                setImg={(e) => setImgs(e)}
                GetMessage={(msgId, qoutedId) => {
                  GetMessage(msgId, qoutedId);
                }}
                type={showRoute(
                  mes,
                  sortedMessages?.[i - 1],
                  sortedMessages?.[i + 1]
                )}
              />
            </React.Fragment>
          ))}
          <div id="scroled" style={{ minHeight: 20 }} />
        </div>

        <>
          {isBlockedEachOther() ? (
            <>
              <div className="flex grow flex-row items-center justify-center medium text-pretty text-[#1d1d1d] bg-gray-200 p-3 rounded-md">
                {translateFunction(
                  "You cannot send messages or calls to this user",
                  language
                )}
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
              {/* Footer input controls */}
              {mics ? (
                <>
                  <div className="chat-input-container bac40">
                    <img
                      src="/icons/chat/mic.svg"
                      height={40}
                      style={{ cursor: "pointer" }}
                    />
                    <div className="mic-chat">
                      <span className="time-mic">{showDuration()}</span>
                      <img src="/icons/chat/wave.svg" className="wave-svg" />
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
                        {translateFunction("Cancel", language)}
                      </div>
                    </div>
                    <img
                      src="/icons/chat/sharechat.svg"
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
                  <div
                    className={`${
                      message.length > 0 && "pr-[23px]"
                    } chat-input-container`}
                  >
                    <img
                      src="/icons/chat/chatplus.svg"
                      style={{ minWidth: 43, cursor: "pointer" }}
                      className="chatplus"
                      onClick={() => {
                        document
                          .querySelector<HTMLInputElement>('input[type="file"]')
                          .click();
                        sendStatus("Sending file...");
                      }}
                      height={40}
                    />
                    <div className="input-chat-container">
                      <label htmlFor="type" className="hidden">
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
                      <img
                        src="/icons/chat/sendbutton.svg"
                        style={{ minWidth: 50, cursor: "pointer" }}
                        onClick={() => {
                          sendTextMessage(message);
                          setMessage("");
                        }}
                      />
                    ) : (
                      <>
                        <img
                          src="/icons/chat/camera.svg"
                          style={{ minWidth: 50, cursor: "pointer" }}
                          className="camer-icon"
                          onClick={() => {
                            setShowMenu(true);
                            sendStatus("Sending file...");
                          }}
                        />
                        <img
                          src="/icons/chat/redmic.svg"
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
                                      translateFunction(
                                        "No available Microphone"
                                      )
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
            </>
          )}
        </>
      </div>
      {showMenu && (
        <CustomPopup
          modalTitle={translateFunction(
            "chosse an image or video from camera or files"
          )}
          close={() => {
            setShowMenu(false);
            setTimeout(() => {
              sendStatus(null);
            }, 3000);
          }}
          options={[
            {
              render: () => <>{translateFunction("files")}</>,
              onClick: () => {
                const fileInput =
                  document.querySelector<HTMLInputElement>(
                    'input[type="file"]'
                  );
                if (fileInput) {
                  // 1. Change "images/*" to "image/*"
                  fileInput.accept = "image/*";

                  // 2. Trigger the click
                  fileInput.click();

                  // 3. Reset the accept attribute after a delay
                  setTimeout(() => {
                    fileInput.accept = FILE_INPUT_ACCEPT;
                  }, 1000);
                }
              },
            },
            {
              render: () => <>{translateFunction("camera")}</>,
              onClick: () => enableCamera(true),
            },
          ]}
        />
      )}
    </>
  );
}

export default ConversationContainer;
