// import mongoose from "mongoose";
// import "dotenv/config";

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("DB connected");
//   } catch (error) {
//     console.error("DB not connected:", error.message);
//     process.exit(1);
//   }
// };

// export default connectDB;


import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("DB already connected");
    return;
  }

  if (!process.env.MONGO_URL) {
    throw new Error("❌ MONGO_URL not found");
  }

  const db = await mongoose.connect(process.env.MONGO_URL);
  isConnected = db.connections[0].readyState === 1;

  console.log("✅ DB connected");
};

export default connectDB;

