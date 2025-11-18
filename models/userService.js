import mongoose from "mongoose";

const userServiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "processing", "Booked", "completed", "cancelled"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
      // top-level status removed — status now tracked per service in services[].status
  },
  { timestamps: true }
);

const UserService = mongoose.model("UserService", userServiceSchema);

export default UserService;
