const { text, image, imageKey, iv } = req.body;
const senderId = req.user._id;
const { id: receiverId } = req.params;

const newMessage = new Message({
  senderId,
  receiverId,
  text,
  image,
  imageKey,
  iv
});

await newMessage.save();

const receiverSocketId = getReceiverSocketId(receiverId);
if (receiverSocketId) {
  io.to(receiverSocketId).emit("newMessage", newMessage);
}

res.status(201).json(newMessage);
