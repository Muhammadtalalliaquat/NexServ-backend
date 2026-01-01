import mongoose from "mongoose";
import "dotenv/config";

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ Using existing database connection");
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGO_URI is not defined in environment variables!");
  }

  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log("✅ MongoDB Connected:", mongoose.connection.host);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    isConnected = false;
    throw error;
  }
};

mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
  isConnected = false;
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected");
  isConnected = false;
});

export default connectDB;
