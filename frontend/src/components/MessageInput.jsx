import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  encryptText,
  importPublicKey,
  getOrCreateKeyPair,
  getStoredPublicKey,
  encryptImageData,
} from "../lib/crypto";
import { axiosInstance } from "../lib/axios";

const MessageInput = ({ selectedUser }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [rawImageBase64, setRawImageBase64] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  useEffect(() => {
    const initKeys = async () => {
      const publicKey = getStoredPublicKey();
      if (!publicKey) {
        const keyPair = await getOrCreateKeyPair();
        const exportedPub = getStoredPublicKey();
        await axiosInstance.post("/users/public-key", { publicKey: exportedPub });
      }
    };
    initKeys();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1]; // only the base64 part
      setImagePreview(dataUrl); // for UI
      setRawImageBase64(base64); // for encryption
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setRawImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !rawImageBase64) return;

    try {
      // Debug: Log the data
      console.log("Raw base64 image:", rawImageBase64);
      console.log("Text message:", text);

      const res = await axiosInstance.get(`/users/${selectedUser._id}/public-key`);
      const recipientKey = await importPublicKey(res.data.publicKey);

      console.log("Recipient public key from server:", res.data.publicKey);

      let encryptedText = null;
      if (text.trim()) {
        encryptedText = await encryptText(recipientKey, text.trim());
      }

      let encryptedImage = null;
      let encryptedKey = null;
      let iv = null;

      if (rawImageBase64) {
        const enc = await encryptImageData(recipientKey, rawImageBase64);
        console.log("Encrypted Image Data:", enc); // Debug
        encryptedImage = enc.encryptedImage;
        encryptedKey = enc.encryptedKey;
        iv = enc.iv;
      }

      await sendMessage({
        text: encryptedText,
        image: encryptedImage,
        imageKey: encryptedKey,
        iv: iv,
      });

      setText("");
      removeImage();
    } catch (err) {
      console.error("❌ Send error:", err);
      toast.error("Failed to send.");
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
            <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center" type="button">
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="input input-bordered rounded-lg w-full"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
          <button type="button" className="btn btn-circle text-zinc-400" onClick={() => fileInputRef.current?.click()}>
            <Image size={20} />
          </button>
        </div>
        <button type="submit" className="btn btn-circle" disabled={!text.trim() && !rawImageBase64}>
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
