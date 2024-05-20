const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, `Please provide a valid rating`],
    },
    title: {
      type: String,
      trim: 5,
      required: [true, `Please provide review title`],
      maxlength: 1000,
    },
    comment: {
      type: String,
      trim: 5,
      required: [true, `Please provide review text`],
      maxlength: 1000,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "ProductSchema",
      required: true,
    },
  },
  { timestamps: true }
);
// trong sản phẩm đó 1 người dùng chỉ đc review 1 lần
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Aggregate pipleline
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    {
      $match: {
        product: productId,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: {
          $avg: "$rating",
        },
        numOfReviews: {
          $sum: 1,
        },
      },
    },
  ]);

  try {
    await this.model("ProductSchema").findOneAndUpdate(
      { _id: productId },
      {
        averageRating: Math.ceil(result[0]?.averageRating || 0),
        numOfReviews: result[0]?.numOfReviews || 0,
      }
    );
  } catch (error) {}
};

ReviewSchema.post("save", async function () {
  await this.constructor.calculateAverageRating(this.product);
});
ReviewSchema.post("remove", async function () {
  await this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model("ReviewSchema", ReviewSchema);
