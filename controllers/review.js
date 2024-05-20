const ReviewSchema = require("../models/Review");
const ProductSchema = require("../models/Product");
const UserSchema = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { checkPermissions } = require("../utils");
const { BadRequestError } = require("../errors");

// chi cho review san pham 1 lan
const createReview = async (req, res) => {
  const { product: productId } = req.body;

  const isValidProduct = await ProductSchema.find({ _id: productId });
  if (!isValidProduct) {
    throw new NotFoundError(`no product with id ${productId}`);
  }

  const alreadySubmitted = await ReviewSchema.findOne({
    product: productId,
    user: req.user.userId,
  });

  if (alreadySubmitted) {
    throw new BadRequestError(`Already submitted review for the product`);
  }
  const userName = await UserSchema.findOne({ _id: req.user.userId });

  req.body.user = req.user.userId;
  req.body.userName = userName.name;

  const review = await ReviewSchema.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (req, res) => {
  const reviews = await ReviewSchema.find({}).populate({
    path: "product",
    select: "name company price",
  });

  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params;

  const review = await ReviewSchema.findOne({ _id: reviewId });
  if (!review) {
    throw new NotFoundError(`No review found with id ${reviewId}`);
  }
  res.status(StatusCodes.OK).json({ review });
};

const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { rating, title, comment } = req.body;

  const review = await ReviewSchema.findOne({ _id: reviewId });
  if (!review) {
    throw new NotFoundError(`No review found with id ${reviewId}`);
  }

  checkPermissions(req.user, review.user);

  review.rating = rating;
  review.title = title;
  review.comment = comment;

  await review.save();

  res.status(StatusCodes.OK).json({ review });
};

const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params;

  const review = await ReviewSchema.findOne({ _id: reviewId });
  if (!review) {
    throw new NotFoundError(`No review found with id ${reviewId}`);
  }

  checkPermissions(req.user, review.user);
  await review.remove();

  res.status(StatusCodes.OK).json({ msg: "Review deleted successfully" });
};

// Cach 2 so vs cach virtual
const getSingleProductReview = async (req, res) => {
  // const { id: productId } = req.params;
  // const review = await ReviewSchema.findOne({ _id: productId });
  // res.status(StatusCodes.OK).json({ review, count: review.length });

  const { id: productId } = req.params;
  const reviews = await ReviewSchema.find({ product: productId });
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReview,
};
