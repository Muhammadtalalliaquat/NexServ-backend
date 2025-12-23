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
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "your_db_name", // optional but recommended
    });

    isConnected = true;
    console.log("DB connected ✅");
  } catch (error) {
    console.error("DB connection failed ❌", error.message);
    // ❌ NO process.exit()
  }
};

export default connectDB;
