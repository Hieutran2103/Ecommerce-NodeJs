const ProductSchema = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
// const { attachCookiesToResponse, createTokenUser } = require("../utils");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");

const {
  BadRequestError,
  UnauthenticatedError,
  CustomAPIError,
  NotFoundError,
} = require("../errors");

const createProduct = async (req, res, next) => {
  req.body.user = req.user.userId;
  const product = await ProductSchema.create(req.body);
  res.status(StatusCodes.CREATED).json({
    product,
  });
};
const getAllProducts = async (req, res) => {
  const {
    search,
    category,
    company,
    colors,
    sort,
    freeShipping,
    numericFilters,
  } = req.query;

  const object = {};

  if (search) {
    object.name = { $regex: search, $options: "i" };
  }
  if (colors) {
    colors === "all" ? (object.colors = "all") : (object.colors = `#${colors}`);
  }
  if (freeShipping) {
    object.freeShipping = freeShipping === "true" ? true : false;
  }
  if (category && category !== "all") {
    object.category = category;
  }
  if (company && company !== "all") {
    object.company = company;
  }

  // nếu dùng logic này thì khong được dùng xss-clean vì nó sẽ lỗi khi dùng dấu "<""
  if (numericFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );
    console.log(filters);
    const options = ["price", "rating"];
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-");
      if (options.includes(field)) {
        object[field] = { [operator]: Number(value) };
      }
    });
  }
  let result = ProductSchema.find(object);

  if (sort === "lowest") {
    result = result.sort("price");
  }
  if (sort === "highest") {
    result = result.sort("-price");
  }
  if (sort === "a-z") {
    result = result.sort("name");
  }
  if (sort === "z-a") {
    result = result.sort("-name");
  }

  const products = await result;

  res.status(StatusCodes.OK).json({ products, count: products.length });
};

const getSingleProduct = async (req, res, next) => {
  const { id: productId } = req.params;
  const product = await ProductSchema.findOne({ _id: productId }).populate({
    path: "reviews",
  });
  if (!product) {
    throw new NotFoundError(`no product  with id ${productId}`);
  }
  res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
  const { id: productId } = req.params;

  const product = await ProductSchema.findOneAndUpdate(
    { _id: productId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!product) {
    throw new NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};
const deleteProduct = async (req, res, next) => {
  const { id: productId } = req.params;

  // const product = await ProductSchema.findOneAndDelete({ _id: productId });
  // if (!product) {
  //   throw new NotFoundError(`no product  with id ${productId}`);
  // }

  const product = await ProductSchema.findOne({ _id: productId });
  if (!product) {
    throw new NotFoundError(`no product  with id ${productId}`);
  }

  await product.remove();
  res.status(StatusCodes.OK).json({ msg: `Success! Deleted product` });
};

const uploadImage = async (req, res, next) => {
  const uploadedUrls = [];
  const filesImage = req.files.image;

  if (!filesImage.length) {
    const result = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: "e-commerce",
      }
    );
    console.log(result);
    fs.unlinkSync(req.files.image.tempFilePath);
    return res.status(StatusCodes.OK).json({ image: [result.secure_url] });
  } else {
    for (const file of filesImage) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        use_filename: true,
        folder: "e-commerce",
      });
      uploadedUrls.push(result.secure_url);
      fs.unlinkSync(file.tempFilePath);
    }

    return res.status(StatusCodes.OK).json({ image: uploadedUrls });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
