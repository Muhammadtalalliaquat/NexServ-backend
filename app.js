import express from "express";
import authRoutes from "./routes/auth.js";
import serviceRoutes from "./routes/serviceRoute.js";
import userServiceRoutes from "./routes/userServiceRoute.js";
import blogsRoutes from "./routes/blogRoute.js";
import contactRoutes from "./routes/contactRoute.js";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Health check endpoints
app.get("/", (req, res) => {
  res.json({ status: "ok", msg: "Server is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", msg: "API is operational" });
});

// API routes
app.use("/user", authRoutes);
app.use("/blogs", blogsRoutes);
app.use("/service", serviceRoutes);
app.use("/contact", contactRoutes);
app.use("/user-service", userServiceRoutes);

export default app;
