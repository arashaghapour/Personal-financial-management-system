import { Router } from "express";

import { authMiddleware } from "../modules/auth/auth.middleware.js";

const router = Router();

router.get("/protected/:userId", authMiddleware, (req, res) => {
  return res.status(200).json({
    userId: req.user?.id,
  });
});

export default router;
