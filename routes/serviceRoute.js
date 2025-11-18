import express from "express";
import sendResponse from "../helpers/Response.js";
import Joi from "joi";
import Service from "../models/Service.js";
import mongoose from "mongoose";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import upload from "../middleware/uploadImage.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const serviceSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name should be at least 3 characters",
    "string.max": "Name should be less than 100 characters",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than 0",
    "any.required": "Price is required",
  }),
  description: Joi.string().min(10).max(1000).required().messages({
    "string.empty": "Description is required",
    "string.min": "Description should be at least 10 characters",
    "string.max": "Description should be less than 1000 characters",
  }),
  category: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
    .messages({
      "array.base": "Category must be an array",
      "array.min": "At least one category is required",
      "any.only": "Invalid category selected",
      "any.required": "Category is required",
    }),
});

router.post("/addService", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const { error, value } = serviceSchema.validate(req.body, {
        abortEarly: false,
      });
      const { title, price, description, category } = value;
      if (error) {
        sendResponse(res, 500, null, true, error.message);
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

      const newService = new Service({
        title,
        price,
        description,
        category,
        image: optimizeUrl,
      });
      await newService.save();
      sendResponse(res, 200, newService, false, "Service created successfully");
    } catch (error) {
      sendResponse(res, 500, null, true, error.message);
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

router.put("/editService/:id", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const { id } = req.params;
      // Preprocess multipart/form-data values: req.body values are strings
      const body = { ...req.body };

      // Category may be sent as JSON string or comma-separated string
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

      // Convert numeric fields
      if (body.price) {
        const num = Number(body.price);
        if (!Number.isNaN(num)) body.price = num;
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

      // Handle image upload if file is provided
      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "Services",
          resource_type: "image",
        });

        // use optimized Cloudinary url
        value.image = cloudinary.url(uploadResult.public_id, {
          fetch_format: "auto",
          quality: "auto",
        });
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

router.delete("/deleteService/:id", autheUser, isAdminCheck, async (req, res) => {
  try {
    const { id } = req.params;

    // validate id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, null, true, "Invalid service id");
    }

    const deletedService = await Service.findByIdAndDelete(id);
    if (!deletedService) {
      return sendResponse(res, 404, null, true, "Service not found");
    }

    return sendResponse(res, 200, deletedService, false, "Service deleted successfully");
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
