import express from "express";
import { sendStatusUpdateEmail } from "../helpers/emailSender.js";
import sendResponse from "../helpers/Response.js";
import UserService from "../models/userService.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";

const router = express.Router();

// router.post("/userAddService", autheUser, async (req, res) => {
//   const { serviceId, planId } = req.body;

//   try {
//     if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
//       return sendResponse(res, 400, null, true, "Invalid or missing serviceId");
//     }

//      if (!planId) {
//       return sendResponse(res, 400, null, true, "Please select a pricing plan");
//     }

//     const serviceExists = await Service.findById(serviceId);
//     if (!serviceExists) {
//       return sendResponse(res, 404, null, true, "Service not found");
//     }

//     let userService = await UserService.findOne({ author: req.user._id });
//     if (!userService) {
//       userService = new UserService({ author: req.user._id, services: [] });
//     }

//     // check if service already added
//     const already = userService.services.some(
//       (s) => s.serviceId.toString() === serviceId && s.planId === planId
//     );

//     if (already) {
//       const populated = await UserService.findById(userService._id).populate(
//         "services.serviceId"
//       );
//       return sendResponse(res, 200, populated, false, "Service & plan already added");
//     }

//     // add and save
//     userService.services.push({
//       serviceId,
//       planId,
//     });
//     await userService.save();

//     const updated = await UserService.findById(userService._id)

//     return sendResponse(res, 200, updated, false, "Your service has been added and is being processed. The administrator will update the status soon.");
//   } catch (error) {
//     return sendResponse(res, 500, null, true, error.message);
//   }
// });

router.post("/userAddService", autheUser, async (req, res) => {
  const { serviceId, planId } = req.body;

  try {
    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return sendResponse(res, 400, null, true, "Invalid or missing serviceId");
    }

    if (!planId) {
      return sendResponse(res, 400, null, true, "Please select a pricing plan");
    }

    const serviceExists = await Service.findById(serviceId);
    if (!serviceExists) {
      return sendResponse(res, 404, null, true, "Service not found");
    }

    // Find plan in pricingPlans
    const planKey = Object.keys(serviceExists.pricingPlans).find(
      (k) => serviceExists.pricingPlans[k].planId === planId
    );
    if (!planKey) {
      return sendResponse(res, 404, null, true, "Plan not found");
    }
    const selectedPlan = serviceExists.pricingPlans[planKey];

    let userService = await UserService.findOne({ author: req.user._id });
    if (!userService) {
      userService = new UserService({ author: req.user._id, services: [] });
    }

    const already = userService.services.some(
      (s) => s.serviceId.toString() === serviceId && s.planId === planId
    );

    if (already) {
      return sendResponse(
        res,
        200,
        already,
        false,
        "Service & plan already added"
      );
    }

    // Check if user already has this service
    const serviceIndex = userService.services.findIndex(
      (s) => s.serviceId.toString() === serviceId
    );

    if (serviceIndex !== -1) {
      // Update existing plan
      userService.services[serviceIndex].planId = planId;
      await userService.save();

      const populated = await UserService.findById(userService._id).populate(
        "services.serviceId"
      );

      return sendResponse(
        res,
        200,
        { userService: populated, selectedPlan },
        false,
        "Service plan updated successfully"
      );
    }

    userService.services.push({ serviceId, planId });
    await userService.save();

    const populated = await UserService.findById(userService._id).populate(
      "services.serviceId"
    );

    return sendResponse(
      res,
      200,
      { userService: populated, selectedPlan },
      false,
      "Your service has been added and is being processed. The administrator will update the status soon."
    );
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/userAllServices", autheUser, async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { author: req.user._id };

    const userService = await UserService.find(filter)
      .populate("author", "userName email isAdmin")
      .populate("services.serviceId")
      .sort({ createdAt: -1 });

    if (!userService || userService.length === 0) {
      return sendResponse(res, 200, [], false, "No services found");
    }

   const servicesWithPlan = userService.map((us) => {
     const updatedServices = us.services.map((s) => {
       const service = s.serviceId;

       const planKey = Object.keys(service?.pricingPlans || {}).find(
         (k) => service.pricingPlans[k].planId === s.planId
       );

       const planData = planKey ? service.pricingPlans[planKey] : null;

       return {
         ...s._doc,
         selectedPlan: planData,
       };
     });

     return {
       ...us._doc,
       services: updatedServices,
     };
   });

    sendResponse(res, 200, servicesWithPlan, false, "User all services fetch");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/eachUserServices", autheUser, async (req, res) => {
  try {
    const userService = await UserService.findOne({ author: req.user._id })
      .populate("author", "userName email isAdmin")
      .populate("services.serviceId")
      .sort({ createdAt: -1 });

    if (!userService || userService.length === 0) {
      return sendResponse(res, 200, [], false, "No services found");
    }
    sendResponse(res, 200, userService, false, "User all services fetch");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.put("/updateService/:id", autheUser, isAdminCheck, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ["processing", "Booked", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return sendResponse(res, 400, null, true, "Invalid status");
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, null, true, "Invalid service item id");
    }

    // update only the subdocument's status
    const updateResult = await UserService.findOneAndUpdate(
      { "services._id": id },
      { $set: { "services.$.status": status } },
      { new: true }
    )
      .populate("author", "userName email")
      .populate("services.serviceId");

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
          id
        );
      }
    } catch (e) {
      console.warn("sendStatusUpdateEmail error:", e?.message || e);
    }

    if (status === "completed") {
      // remove only the completed subdocument
      await UserService.updateOne({}, { $pull: { services: { _id: id } } });
      return sendResponse(
        res,
        200,
        null,
        false,
        "Service item completed and removed from user list"
      );
    }

    return sendResponse(
      res,
      200,
      updated,
      false,
      "Status updated successfully"
    );
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
