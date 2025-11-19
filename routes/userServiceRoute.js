import express from "express";
import { sendStatusUpdateEmail } from "../helpers/emailSender.js";
import sendResponse from "../helpers/Response.js";
import UserService from "../models/userService.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";

const router = express.Router();

router.post("/userAddService", autheUser, async (req, res) => {
  const { serviceId } = req.body;

  try {
    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return sendResponse(res, 400, null, true, "Invalid or missing serviceId");
    }

    const serviceExists = await Service.findById(serviceId);
    if (!serviceExists) {
      return sendResponse(res, 404, null, true, "Service not found");
    }

    let userService = await UserService.findOne({ author: req.user._id });
    if (!userService) {
      userService = new UserService({ author: req.user._id, services: [] });
    }

    // check if service already added
    const already = userService.services.some(
      (s) => s.serviceId.toString() === serviceId
    );

    if (already) {
      const populated = await UserService.findById(userService._id).populate(
        "services.serviceId"
      );
      return sendResponse(res, 200, populated, false, "Service already added for user");
    }

    // add and save
    userService.services.push({ serviceId });
    await userService.save();

    const updated = await UserService.findById(userService._id).populate(
      "services.serviceId"
    );

    return sendResponse(res, 200, updated, false, "Service added to user");
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});


router.get("/userAllServices", autheUser, async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { author: req.user._id };

    const orders = await UserService.find(filter)
      .populate("author", "userName email isAdmin")
      .populate("services.serviceId")
      .sort({ createdAt: -1 });
    sendResponse(res, 200, orders, false, "User all services fetch");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});



router.put("/updateService/:serviceItemId", autheUser, isAdminCheck, async (req, res) => {
    const { serviceItemId } = req.params;
    const { status } = req.body;

  try {
    const validStatuses = [
      "pending",
      "processing",
      "Booked",
      "completed",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      return sendResponse(res, 400, null, true, "Invalid status");
    }

    if (!serviceItemId || !mongoose.Types.ObjectId.isValid(serviceItemId)) {
      return sendResponse(res, 400, null, true, "Invalid service item id");
    }

    // update only the subdocument's status
    const updateResult = await UserService.findOneAndUpdate(
      { "services._id": serviceItemId },
      { $set: { "services.$.status": status } },
      { new: true }
    )
      .populate("author", "userName email")
      .populate("services.serviceId", "title price image");

    if (!updateResult)
      return sendResponse(res, 404, null, true, "Service item not found");

    const updated = updateResult;

    // Optional: send email if helper exists and user email is present
    try {
      if (
        typeof sendStatusUpdateEmail === "function" &&
        updated.author?.email
      ) {
        // send email about the item status change — pass service item id for clarity
        sendStatusUpdateEmail(
          updated.author.email,
          updated.author.userName || "",
          status,
          serviceItemId
        );
      }
    } catch (e) {
      console.warn("sendStatusUpdateEmail error:", e?.message || e);
    }

    if (status === "completed") {
      // remove only the completed subdocument
      await UserService.updateOne({}, { $pull: { services: { _id: serviceItemId } } });
      return sendResponse(
        res,
        200,
        null,
        false,
        "Service item completed and removed from user list"
      );
    }

    return sendResponse(res, 200, updated, false, "Status updated successfully");
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
  }
);

export default router;