import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import connectDB from "./database/data.js";
import userServiceRoutes from "./routes/userServiceRoute.js";
import serviceRoutes from "./routes/serviceRoute.js";
import contactRoutes from "./routes/contactRoute.js";
import blogsRoutes from "./routes/blogRoute.js";
import reviewRoutes from "./routes/reviewRoute.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB Connection Error:", error);
    res.status(500).json({
      error: true,
      data: null,
      msg: "Database connection failed",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running and DB is connected");
});

app.use("/user", authRoutes);
app.use("/blogs", blogsRoutes);
app.use("/service", serviceRoutes);
app.use("/contact-us", contactRoutes);
app.use("/user-review", reviewRoutes);
app.use("/user-service", userServiceRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    data: null,
    msg: err.message || "Something went wrong!",
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
}
export default app;
