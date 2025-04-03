import express from "express";
import { uploadPublicKey, getPublicKey } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/users/public-key", protectRoute, uploadPublicKey);
router.get("/users/:id/public-key", protectRoute, getPublicKey);

export default router;