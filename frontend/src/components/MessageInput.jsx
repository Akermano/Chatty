import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  encryptText,
  importPublicKey,
  getOrCreateKeyPair,
  getStoredPublicKey,
} from "../lib/crypto";
import { axiosInstance } from "../lib/axios";

const MessageInput = ({ selectedUser }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  // Upload public key if not present
  useEffect(() => {
    const initKeys = async () => {
      const publicKey = getStoredPublicKey();
      if (!publicKey) {
        try {
          const keyPair = await getOrCreateKeyPair();
          const exportedPub = getStoredPublicKey();

          const res = await axiosInstance.post("/users/public-key", {
            publicKey: exportedPub,
          });

          if (res.status === 200) {
            console.log("✅ Public key uploaded");
          } else {
            console.warn("⚠️ Unexpected status uploading public key", res.status);
          }
        } catch (err) {
          console.error("❌ Failed to generate/upload public key:", err);
        }
      }
    };
    initKeys();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      console.log("Sending to user:", selectedUser._id);

      const res = await axiosInstance.get(`/users/${selectedUser._id}/public-key`);
      const data = res.data;

      console.log("Fetched public key from backend:", data);

      if (!data.publicKey) throw new Error("Recipient has no public key");

      const recipientKey = await importPublicKey(data.publicKey);
      console.log("Imported recipient key:", recipientKey);

      const trimmedText = text.trim();
      let encryptedText = null;

      if (trimmedText) {
        console.log("Original message:", trimmedText);
        encryptedText = await encryptText(recipientKey, trimmedText);
        console.log("Encrypted message:", encryptedText);
      }

      await sendMessage({
        text: encryptedText,
        image: imagePreview,
      });

      console.log("✅ Message sent successfully");

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("❌ Failed to send encrypted message:", error);
      toast.error("Failed to send message: " + error.message);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
