import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Encrypted text message
  text: {
    type: String,
  },
  // Encrypted base64 image (if any)
  image: {
    type: String,
  },
  // Encrypted AES key used to encrypt the image
  imageKey: {
    type: String,
  },
  // Initialization vector used for AES-GCM
  iv: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", MessageSchema);

export default Message;
