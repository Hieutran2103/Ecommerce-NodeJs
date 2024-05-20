const OrderSchema = require("../models/Order");
const ProductSchema = require("../models/Product");
const UserSchema = require("../models/User");
const stripe = require("stripe")(process.env.STRIKE_KEY);
const { StatusCodes } = require("http-status-codes");
const {
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
} = require("../utils");

const {
  BadRequestError,
  UnauthenticatedError,
  CustomAPIError,
  NotFoundError,
} = require("../errors");

// const fakeStripeAPI = async ({ amount, currency }) => {
//   const client_secret = "somevalue";
//   return { client_secret, amount };
// };

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;
  if (!cartItems || cartItems.length < 1) {
    throw new BadRequestError(`No cart items provided`);
  }
  if (!tax || !shippingFee) {
    throw new BadRequestError(`Please provide shipping and tax fee`);
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await ProductSchema.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new NotFoundError(`No product with id: ${item.product} `);
    }

    const { name, price, image, _id } = dbProduct;

    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };

    // them item vao order
    orderItems = [...orderItems, singleOrderItem];
    // calculate subtotal total
    subtotal += item.amount * price;
  }

  // calculate total
  const total = tax + shippingFee + subtotal;
  // get client secret

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  const userName = await UserSchema.findOne({ _id: req.user.userId });
  const order = await OrderSchema.create({
    tax,
    total,
    orderItems,
    subtotal,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
    userName: userName.name,
  });

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
  const orders = await OrderSchema.find({});

  const totalSum = orders.reduce((accumulator, currentOrder) => {
    return accumulator + currentOrder.total;
  }, 0);

  res
    .status(StatusCodes.OK)
    .json({ orders, count: orders.length, earning: totalSum });
};

const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await OrderSchema.find({ _id: orderId });
  if (!order) {
    throw new NotFoundError(`No product with id: ${orderId} `);
  }
  checkPermissions(req.user, order.user);
  res.status(StatusCodes.OK).json({ order });
};

const getCurrentUserOrders = async (req, res) => {
  const orders = await OrderSchema.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntent } = req.body;

  const order = await OrderSchema.findOne({ _id: orderId });
  if (!order) {
    throw new NotFoundError(`No product with id: ${orderId} `);
  }
  checkPermissions(req.user, order.user);
  order.paymentIntent = paymentIntent;
  order.status = "paid";
  await OrderSchema.save();

  res.status(StatusCodes.OK).json({ order });
};

const show = async (req, res) => {
  const startOfMonth = new Date(); // Ngày bắt đầu của tháng
  startOfMonth.setDate(1); // Đặt ngày bắt đầu của tháng
  const endOfMonth = new Date(); // Ngày kết thúc của tháng
  endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Đặt tháng kế tiếp
  endOfMonth.setDate(0); // Lùi về ngày cuối cùng của tháng hiện tại

  const transformedData = await OrderSchema.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$createdAt" }, // Nhóm theo ngày trong tháng
        },
        count: { $sum: 1 }, // Đếm số lượng đơn hàng trong mỗi ngày
        totalAmount: { $sum: "$total" }, // Tính tổng số tiền trong mỗi ngày
      },
    },
    { $sort: { "_id.day": 1 } },
  ]);

  const show = transformedData.map((item) => {
    const day = item._id.day;

    // Lấy ngày và tháng từ startOfMonth
    const startOfMonthDate = new Date(startOfMonth);
    const month = startOfMonthDate.getMonth() + 1; // Bổ sung 1 vì tháng trong JavaScript bắt đầu từ 0

    // Định dạng ngày và tháng
    const formattedDate = `${day}/${month}`;

    return {
      day: formattedDate,
      count: item.count,
      totalAmount: item.totalAmount,
    };
  });

  res.status(StatusCodes.OK).json({ show });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
  show,
};
