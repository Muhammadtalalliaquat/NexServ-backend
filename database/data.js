import mongoose from "mongoose";
import "dotenv/config";

/**
 * Robust connection helper for serverless and long-running processes.
 * - Reuses existing mongoose connection if present
 * - Throws errors instead of calling process.exit so serverless handlers can return 500
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    console.log("DB already connected");
    return mongoose.connection;
  }

  try {
    // Set a reasonable server selection timeout so lambda cold starts fail fast on bad config
    await mongoose.connect(uri, {
      // Mongoose 6+ uses unified topology by default. Keep serverSelectionTimeoutMS to fail fast.
      serverSelectionTimeoutMS: 5000,
    });
    console.log("DB connected");
    return mongoose.connection;
  } catch (error) {
    console.error("DB not connected:", error.message);
    // Throw so callers (serverless handler) can return a 500 instead of exiting the process
    throw error;
  }
};
const getReadyState = () => mongoose.connection.readyState;

export { getReadyState };
export default connectDB;
