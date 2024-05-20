require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();

// Các require khác...
const fileUpload = require("express-fileupload");
//connectDB
const connectDB = require("./db/connect");
//routers
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const orderRouter = require("./routes/orderRoutes");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

//USE V2
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// extra packages
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
// const cors = require("cors");
// const corsOptions = {
//   origin: "http://localhost:5173",
//   credentials: true,
// };
app.use(express.static("./public"));
// app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());
// app.use(xss());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(fileUpload({ useTempFiles: true }));
// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
//port
const port = process.env.PORT || 3000;
//start
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};
start();
