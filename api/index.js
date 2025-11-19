import serverless from "serverless-http";
import app, { initDb } from "../app.js";

let handler;
let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
    handler = serverless(app);
  }
}

export default async function (req, res) {
  try {
    await ensureDb();
    return handler(req, res);
  } catch (err) {
    console.error("Serverless handler init error:", err);
    res.status(500).json({ error: true, msg: "Server initialization failed" });
  }
}
