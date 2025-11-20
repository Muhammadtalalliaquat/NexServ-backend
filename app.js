import express from "express";
import authRoutes from "./routes/auth.js";
import serviceRoutes from "./routes/serviceRoute.js";
import userServiceRoutes from "./routes/userServiceRoute.js";
import blogsRoutes from "./routes/blogRoute.js";
import contactRoutes from "./routes/contactRoute.js";
import morgan from "morgan";
import connectDB from "./database/data.js";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Health check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Health + DB status (useful for debugging in production)
import { getReadyState } from "./database/data.js";

app.get("/health", (req, res) => {
  try {
    const state = {
      server: "ok",
      // mongoose readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
      dbReadyState: getReadyState(),
    };
    res.json({ error: false, data: state, msg: "Health status" });
  } catch (err) {
    res.status(500).json({ error: true, msg: err.message });
  }
});

app.use("/user", authRoutes);
app.use("/blogs", blogsRoutes);
app.use("/service", serviceRoutes);
app.use("/contact", contactRoutes);
app.use("/user-service", userServiceRoutes);

export async function initDb() {
  return connectDB();
}

export default app;
