import mongoose from "mongoose";
import "dotenv/config";

let cachedConnection = null;

const connectDB = async () => {
  // Check if we have a cached connection AND it's still connected
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("✅ Using cached database connection");
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10, // Add connection pooling
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    cachedConnection = conn;
    console.log("✅ MongoDB Connected:", conn.connection.host);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    cachedConnection = null; // Reset cache on error
    throw error; // Throw error instead of process.exit
  }
};

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
