const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  image: { type: String }, // Encrypted base64
  imageKey: { type: String }, // Encrypted AES key
  iv: { type: String }, // AES IV
  createdAt: { type: Date, default: Date.now },
});
