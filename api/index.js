import serverless from "serverless-http";
import app from "../app.js";
import connectDB from "../database/data.js";

let dbInitialized = false;
let handler;

export default async function (req, res) {
  try {
    if (!dbInitialized) {
      console.log("[API] Initializing database...");
      await connectDB();
      dbInitialized = true;
      handler = serverless(app);
      console.log("[API] Database initialized, handler ready");
    }
    console.log(`[API] ${req.method} ${req.url}`);
    return handler(req, res);
  } catch (err) {
    console.error("[API] Error:", err.message);
    return res.status(500).json({ error: true, msg: err.message });
  }
}
