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
  decryptAESKeyWithRSA,
  decryptImageWithAES,
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
  const [decryptedMessages, setDecryptedMessages] = useState([]);

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
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    const processMessages = async () => {
      if (!privateKey) return;
      const processed = await Promise.all(
        messages.map(async (msg) => {
          let text = msg.text;
          let image = msg.image;

          if (text && privateKey) {
            try {
              text = await decryptText(privateKey, text);
            } catch {
              text = "[Failed to decrypt text]";
            }
          }

          if (msg.image && msg.imageKey && msg.iv) {
            try {
              const aesKey = await decryptAESKeyWithRSA(msg.imageKey, privateKey);
              image = await decryptImageWithAES(aesKey, msg.image, msg.iv);
            } catch {
              image = "[Failed to decrypt image]";
            }
          }

          return { ...msg, text, image };
        })
      );
      setDecryptedMessages(processed);
    };

    processMessages();
  }, [messages, privateKey]);

  useEffect(() => {
    if (messageEndRef.current && decryptedMessages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [decryptedMessages]);

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
        {decryptedMessages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>

            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            <div className="chat-bubble flex flex-col">
              {message.image && typeof message.image === "string" && message.image.startsWith("data:") ? (
                <img
                  src={message.image}
                  alt="Decrypted attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              ) : null}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput selectedUser={selectedUser} />
    </div>
  );
};

export default ChatContainer;
