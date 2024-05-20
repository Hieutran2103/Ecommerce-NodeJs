const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authentication");

const {
  login,
  logout,
  register,
  verifyEmail,
  resetPassword,
  forgotPassword,
} = require("../controllers/auth");

router.post("/login", login);
// router.get("/logout", logout);
router.delete("/logout", authenticateUser, logout);
router.post("/register", register);

router.post("/verify-email", verifyEmail);

router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);

module.exports = router;
