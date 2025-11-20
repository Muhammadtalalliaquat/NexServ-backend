// import serverless from "serverless-http";
// import app, { initDb } from "../app.js";

// let handler;
// let dbInitialized = false;

// async function ensureDb() {
//   if (!dbInitialized) {
//     console.log("api/index: initializing DB...");
//     await initDb();
//     dbInitialized = true;
//     handler = serverless(app);
//     console.log("api/index: DB initialized and handler ready");
//   }
// }

// export default async function (req, res) {
//   try {
//     await ensureDb();
//     console.log(`api/index: incoming ${req.method} ${req.url}`);
//     return handler(req, res);
//   } catch (err) {
//     console.error("Serverless handler init error:", err);
//     return res.status(500).json({ error: true, msg: "Server initialization failed", detail: err.message });
//   }
// }
