import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import {
  decryptText,
  importPrivateKey,
  getStoredPrivateKey,
  decryptImageData,
} from "../lib/crypto";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [privateKey, setPrivateKey] = useState(null);

  useEffect(() => {
    const loadPrivateKey = async () => {
      const stored = getStoredPrivateKey();
      if (stored) {
        const key = await importPrivateKey(stored);
        setPrivateKey(key);
      }
    };
    loadPrivateKey();
  }, []);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const renderMessage = (message) => {
    const isSender = message.senderId === authUser._id;

    const [decryptedText, setDecryptedText] = useState(null);
    const [decryptedImage, setDecryptedImage] = useState(null);

    useEffect(() => {
      const decryptAll = async () => {
        if (privateKey && message.text) {
          const txt = await decryptText(privateKey, message.text);
          setDecryptedText(txt);
        }
        if (privateKey && message.image && message.imageKey && message.iv) {
          const img = await decryptImageData(privateKey, message.image, message.imageKey, message.iv);
          setDecryptedImage(`data:image/jpeg;base64,${img}`);
        }
      };
      decryptAll();
    }, [privateKey]);

    return (
      <div key={message._id} className={`chat ${isSender ? "chat-end" : "chat-start"}`} ref={messageEndRef}>
        <div className="chat-image avatar">
          <div className="size-10 rounded-full border">
            <img src={isSender ? authUser.profilePic : selectedUser.profilePic} alt="profile" />
          </div>
        </div>
        <div className="chat-header mb-1">
          <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
        </div>
        <div className="chat-bubble flex flex-col">
          {decryptedImage && <img src={decryptedImage} alt="Image" className="sm:max-w-[200px] rounded-md mb-2" />}
          {decryptedText && <p>{decryptedText}</p>}
        </div>
      </div>
    );
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => renderMessage(msg))}
      </div>
      <MessageInput selectedUser={selectedUser} />
    </div>
  );
};

export default ChatContainer;
