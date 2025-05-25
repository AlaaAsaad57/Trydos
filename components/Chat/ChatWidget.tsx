import React, { useEffect, useRef, useState } from "react";
import DeliveryIcon from "public/svg/delivery.svg";
import CloseIcon from "public/svg/close.svg";
import SendIcon from "public/svg/send.svg";

interface Message {
  id: string;
  text: string;
  isSent: boolean;
  timestamp: Date;
}

export default function ChatWidget({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      if (scrollTop === 0 && !loading) {
        loadMoreMessages();
      }
    }
  };

  const loadMoreMessages = async () => {
    setLoading(true);
    // Simulated API call to load more messages
    setTimeout(() => {
      const newMessages: Message[] = [
        {
          id: Math.random().toString(),
          text: `Loaded message ${page}`,
          isSent: Math.random() > 0.5,
          timestamp: new Date(),
        },
      ];
      setMessages((prev) => [...newMessages, ...prev]);
      setPage((prev) => prev + 1);
      setLoading(false);
    }, 1000);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Math.random().toString(),
        text: inputText,
        isSent: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
      scrollToBottom();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 w-screen h-[calc(100vh-100px)] bg-white z-[999999999999]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center">
          <DeliveryIcon className="w-8 h-8 text-blue-600" />
          <span className="ml-2 font-medium">Delivery Center</span>
        </div>
        <button onClick={onClose} className="p-1">
          <CloseIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Messages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-col h-[calc(100vh-100px)] overflow-y-auto p-4"
      >
        {loading && (
          <div className="text-center py-2 text-gray-500">Loading...</div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[70%] mb-4 ${
              message.isSent ? "ml-auto" : "mr-auto"
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                message.isSent
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.text}
            </div>
            <div
              className={`text-xs text-gray-500 mt-1 ${
                message.isSent ? "text-right" : "text-left"
              }`}
            >
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="w-[30px] h-[30px] justify-center flex items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
