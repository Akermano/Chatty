import User from "../models/user.model.js";

// POST /api/users/public-key
export const uploadPublicKey = async (req, res) => {
  try {
    const userId = req.user._id;
    const { publicKey } = req.body;

    await User.findByIdAndUpdate(userId, { publicKey });

    res.status(200).json({ message: "Public key updated" });
  } catch (err) {
    console.error("uploadPublicKey error:", err);
    res.status(500).json({ error: "Failed to store public key" });
  }
};

// GET /api/users/:id/public-key
export const getPublicKey = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("publicKey");
    if (!user || !user.publicKey) {
      return res.status(404).json({ error: "Public key not found" });
    }

    res.status(200).json({ publicKey: user.publicKey });
  } catch (err) {
    console.error("getPublicKey error:", err);
    res.status(500).json({ error: "Failed to fetch public key" });
  }
};