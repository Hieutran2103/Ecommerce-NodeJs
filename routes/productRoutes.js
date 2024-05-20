const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizePermission,
} = require("../middleware/authentication");
const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require("../controllers/product");

// Cach 2 so vs cach virtual
const { getSingleProductReview } = require("../controllers/review");

router.get("/", getAllProducts);
router.post("/", authenticateUser, authorizePermission("admin"), createProduct);

router.post(
  "/uploadImage",
  authenticateUser,
  authorizePermission("admin"),
  // upload.array("images", 5),
  uploadImage
);

router.get("/:id", getSingleProduct);

router.patch(
  "/:id",
  authenticateUser,
  authorizePermission("admin"),
  updateProduct
);
router.delete(
  "/:id",
  authenticateUser,
  authorizePermission("admin"),
  deleteProduct
);

// Cach 2 so vs cach virtual
router.get("/:id/reviews", getSingleProductReview);

module.exports = router;
