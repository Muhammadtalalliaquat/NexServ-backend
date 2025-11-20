import serverless from "serverless-http";
import app from "../app.js";
import connectDB from "../database/data.js";

let dbInitialized = false;

export default async function handler(req, res) {
  if (!dbInitialized) {
    await connectDB();
    dbInitialized = true;
  }
  return serverless(app)(req, res);
}
