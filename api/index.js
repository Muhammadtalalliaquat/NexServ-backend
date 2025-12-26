import express from "express";
import cors from "cors";
import morgan from "morgan";

import connectDB from "../config/db.js";

import authRoutes from "../routes/authRoutes.js";
import blogsRoutes from "../routes/blogsRoutes.js";
import serviceRoutes from "../routes/serviceRoutes.js";
import contactRoutes from "../routes/contactRoutes.js";
import reviewRoutes from "../routes/reviewRoutes.js";
import userServiceRoutes from "../routes/userServiceRoutes.js";

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));

connectDB();

app.get("/", (req, res) => {
  res.send("Backend running on Vercel ✅");
});

app.use("/user", authRoutes);
app.use("/blogs", blogsRoutes);
app.use("/service", serviceRoutes);
app.use("/contact-us", contactRoutes);
app.use("/user-review", reviewRoutes);
app.use("/user-service", userServiceRoutes);

// ❌ NO app.listen
export default app;
