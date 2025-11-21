import express from "express";
import sendResponse from "../helpers/Response.js";
import Joi from "joi";
import Service from "../models/Service.js";
import mongoose from "mongoose";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import upload from "../middleware/uploadImage.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Helper to accept either array of strings or comma/JSON string for features/categories
const stringOrStringArray = Joi.alternatives()
  .try(Joi.array().items(Joi.string()), Joi.string())
  .messages({ "alternatives.types": "Must be a string or array of strings" });

const planSchema = Joi.object({
  price: Joi.number().min(0).required().messages({
    "number.base": "Plan price must be a number",
    "number.min": "Plan price must be >= 0",
    "any.required": "Plan price is required",
  }),
  features: stringOrStringArray.optional(),
});

const serviceSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name should be at least 3 characters",
    "string.max": "Name should be less than 100 characters",
  }),
  // price is optional if pricingPlans provided
  // price: Joi.number().min(0).optional().messages({
  //   "number.base": "Price must be a number",
  //   "number.min": "Price must be greater than or equal to 0",
  // }),
  description: Joi.string().min(10).max(1000).required().messages({
    "string.empty": "Description is required",
    "string.min": "Description should be at least 10 characters",
    "string.max": "Description should be less than 1000 characters",
  }),
  category: stringOrStringArray.required().messages({
    "any.required": "Category is required",
  }),
  pricingPlans: Joi.object({
    basic: planSchema.optional(),
    standard: planSchema.optional(),
    premium: planSchema.optional(),
  }).optional(),
}).or('price','pricingPlans');

router.post("/addService", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const body = { ...req.body };

      if (body.category && typeof body.category === "string") {
        try {
          body.category = JSON.parse(body.category);
        } catch (e) {
          body.category = body.category
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      // if (body.price) {
      //   const num = Number(body.price);
      //   if (!Number.isNaN(num)) body.price = num;
      // }

      if (body.pricingPlans && typeof body.pricingPlans === "string") {
        try {
          body.pricingPlans = JSON.parse(body.pricingPlans);
        } catch (e) {
          // leave as-is; Joi will validate shape
        }
      }
      if (body.pricingPlans && typeof body.pricingPlans === "object") {
        ["basic", "standard", "premium"].forEach((plan) => {
          if (body.pricingPlans[plan] && body.pricingPlans[plan].features && typeof body.pricingPlans[plan].features === "string") {
            body.pricingPlans[plan].features = body.pricingPlans[plan].features
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        });
      }

      const { error, value } = serviceSchema.validate(body, {
        abortEarly: false,
      });

      if (error) {
        const message = Array.isArray(error.details)
          ? error.details.map((d) => d.message).join("; ")
          : error.message;
        return sendResponse(res, 400, null, true, message);
      }

      if (!req.file) {
        return sendResponse(res, 400, null, true, "Image is required");
      }

      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: "Services",
        resource_type: "image",
      });

      const optimizeUrl = cloudinary.url(uploadResult.public_id, {
        fetch_format: "auto",
        quality: "auto",
      });

      // ensure category is an array when saving
      const categoryToSave = Array.isArray(value.category) ? value.category : String(value.category).split(",").map(s => s.trim()).filter(Boolean);

      const newService = new Service({
        title: value.title,
        // price: value.price,
        description: value.description,
        category: categoryToSave,
        pricingPlans: value.pricingPlans,
        image: optimizeUrl,
        imagePublicId: uploadResult.public_id,
      });
      await newService.save();
      sendResponse(res, 200, newService, false, "Service created successfully");
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
    }
  }
);



router.put("/editService/:id", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const { id } = req.params;
      const body = { ...req.body };

      if (body.category && typeof body.category === "string") {
        try {
          body.category = JSON.parse(body.category);
        } catch (e) {
          body.category = body.category
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }


      if (body.pricingPlans && typeof body.pricingPlans === "string") {
        try {
          body.pricingPlans = JSON.parse(body.pricingPlans);
        } catch (e) {
          // leave as-is; Joi will validate shape
        }
      }
      if (body.pricingPlans && typeof body.pricingPlans === "object") {
        ["basic", "standard", "premium"].forEach((plan) => {
          if (
            body.pricingPlans[plan] &&
            body.pricingPlans[plan].features &&
            typeof body.pricingPlans[plan].features === "string"
          ) {
            body.pricingPlans[plan].features = body.pricingPlans[plan].features
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        });
      }

      // if (body.price) {
      //   const num = Number(body.price);
      //   if (!Number.isNaN(num)) body.price = num;
      // }

      const { error, value } = serviceSchema.validate(body, {
        abortEarly: false,
      });

      if (error) {
        const message = Array.isArray(error.details)
          ? error.details.map((d) => d.message).join("; ")
          : error.message;
        return sendResponse(res, 400, null, true, message);
      }

      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "Services",
          resource_type: "image",
        });

        value.image = cloudinary.url(uploadResult.public_id, {
          fetch_format: "auto",
          quality: "auto",
        });
        value.imagePublicId = uploadResult.public_id;
      }

      const updatedService = await Service.findByIdAndUpdate(id, value, {
        new: true,
      });

      if (!updatedService) {
        return sendResponse(res, 404, null, true, "Service not found");
      }

      return sendResponse(
        res,
        200,
        { service: updatedService },
        false,
        "Service updated successfully"
      );
    } catch (error) {
      return sendResponse(res, 500, null, true, error.message);
    }
  }
);



router.get("/fetchService", async (req, res) => {
  try {
    const service = await Service.find();
    sendResponse(res, 200, service, false, "Service fetch successfully");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.delete("/deleteService/:id", autheUser, isAdminCheck, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, null, true, "Invalid service id");
    }

    const deletedService = await Service.findByIdAndDelete(id);
    if (!deletedService) {
      return sendResponse(res, 404, null, true, "Service not found");
    }

    // Attempt to delete image from Cloudinary if we have a public_id
    try {
      const publicId = deletedService.imagePublicId;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      } else if (deletedService.image) {
        const parts = deletedService.image.split("/");
        const last = parts[parts.length - 1] || "";
        const publicIdFromUrl = last.split(".")[0];
        if (publicIdFromUrl) {
          await cloudinary.uploader.destroy(publicIdFromUrl);
        }
      }
    } catch (e) {
      console.error("Cloudinary delete failed:", e.message || e);
    }

    return sendResponse(res, 200, deletedService, false, "Service deleted successfully");
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
