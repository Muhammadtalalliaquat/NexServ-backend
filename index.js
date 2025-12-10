import express from "express";
import authRoutes from "./routes/auth.js";
import serviceRoutes from "./routes/serviceRoute.js";
import userServiceRoutes from "./routes/userServiceRoute.js";
import blogsRoutes from "./routes/blogRoute.js";
import contactRoutes from "./routes/contactRoute.js";
import reviewRoutes from "./routes/reviewRoute.js";
import connectDB from "./database/data.js";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
// import http from "http";
// import path from "path";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

connectDB()
  .then(() => {
    app.get("/", (req, res) => {
      res.send("Server is running and DB is connected");
    });

    app.get("/", (req, res) => {
      res.send("Server is running and DB is connected");
    });

    app.use("/user", authRoutes);
    app.use("/blogs", blogsRoutes);
    app.use("/service", serviceRoutes);
    app.use("/contact", contactRoutes);
    app.use("/user-review", reviewRoutes);
    app.use("/user-service", userServiceRoutes);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB not connected Server is not running:", err.message);
    process.exit(1); // Exit the process if DB connection fails
  });
