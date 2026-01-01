import mongoose from "mongoose";
import "dotenv/config";

let isConnected = false;

const connectDB = async () => {
  // If already connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ Using existing database connection");
    return;
  }

  // Check if MONGO_URI exists
  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGO_URI is not defined in environment variables!");
  }

  try {
    // Set strictQuery option
    mongoose.set("strictQuery", false);

    // Connect to MongoDB
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

// Handle connection events
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

// import mongoose from "mongoose";
// import "dotenv/config";

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("DB connected");
//   } catch (error) {
//     console.error("DB not connected:", error.message);
//     process.exit(1); // Exit process with failure
//   }
// };

// export default connectDB;
