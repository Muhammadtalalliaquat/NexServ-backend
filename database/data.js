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


import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB error ❌", err.message);
    // ❌ NEVER process.exit on Vercel
  }
};

export default connectDB;

