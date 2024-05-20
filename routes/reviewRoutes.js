const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizePermission,
} = require("../middleware/authentication");
const {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReview,
} = require("../controllers/review");

router.get("/", getAllReviews);
router.post("/", authenticateUser, createReview);

// router.get("/:id", getSingleReview);

router.get("/:id", getSingleProductReview);

router.patch("/:id", authenticateUser, updateReview);
router.delete("/:id", authenticateUser, deleteReview);

module.exports = router;
