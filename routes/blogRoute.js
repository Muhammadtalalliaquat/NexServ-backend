import express from "express";
import sendResponse from "../helpers/Response.js";
import Joi from "joi";
import Service from "../models/Service.js";
import Blog from "../models/Blog.js";
import mongoose from "mongoose";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import upload from "../middleware/uploadImage.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const blogValidation = Joi.object({
  title: Joi.string().min(5).required(),
  content: Joi.string().min(20).required(),
  tags: Joi.array().items(Joi.string()).default([]),
});

router.post("/addBlog", autheUser, isAdminCheck,upload.single("image"), async (req, res) => {
    try {
      // Normalize tags coming from multipart/form-data (may be a string)
      let incomingTags = req.body.tags;
      let parsedTags = [];
      if (incomingTags) {
        if (Array.isArray(incomingTags)) {
          parsedTags = incomingTags
            .map((t) => String(t).trim())
            .filter(Boolean);
        } else if (typeof incomingTags === "string") {
          // try JSON array first: "[\"a\",\"b\"]"
          try {
            const maybe = JSON.parse(incomingTags);
            if (Array.isArray(maybe)) {
              parsedTags = maybe.map((t) => String(t).trim()).filter(Boolean);
            } else {
              // fallback to comma-separated
              parsedTags = incomingTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            }
          } catch (e) {
            parsedTags = incomingTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
          }
        }
      }

      const bodyForValidation = { ...req.body, tags: parsedTags };

      const { error, value } = blogValidation.validate(bodyForValidation, {
        abortEarly: false,
      });

      if (error) {
        return sendResponse(res, 400, null, true, error.message);
      }

      const { title, content, tags } = value;
      let imageUrl = null;

      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const imageData = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResult = await cloudinary.uploader.upload(imageData, {
          folder: "Blogs",
          transformation: [
            { fetch_format: "auto", quality: "auto" },
            { width: 800, height: 600, crop: "auto", gravity: "auto" },
          ],
        });

        imageUrl = uploadResult.secure_url;
      }

      const newBlog = await Blog.create({
        author: req.user._id,
        title,
        content,
        tags,
        image: imageUrl,
      });

      return sendResponse(
        res,
        201,
        newBlog,
        false,
        "Blog created successfully"
      );
    } catch (err) {
      console.log("Blog Error:", err);
      return sendResponse(res, 500, null, true, err.message);
    }
  }
);

router.put("/editBlog/:id", autheUser, isAdminCheck, upload.single("image"), async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendResponse(res, 400, null, true, "Invalid blog id provided");
      }

      // Normalize tags coming from multipart/form-data (may be a string)
      let incomingTags = req.body.tags;
      let parsedTags = [];
      if (incomingTags) {
        if (Array.isArray(incomingTags)) {
          parsedTags = incomingTags
            .map((t) => String(t).trim())
            .filter(Boolean);
        } else if (typeof incomingTags === "string") {
          try {
            const maybe = JSON.parse(incomingTags);
            if (Array.isArray(maybe)) {
              parsedTags = maybe.map((t) => String(t).trim()).filter(Boolean);
            } else {
              parsedTags = incomingTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            }
          } catch (e) {
            parsedTags = incomingTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
          }
        }
      }

      const bodyForValidation = { ...req.body, tags: parsedTags };

      const { error, value } = blogValidation.validate(bodyForValidation, {
        abortEarly: false,
      });

      if (error) {
        return sendResponse(res, 400, null, true, error.message);
      }

      const { title, content, tags } = value;
      let imageUrl = null;

      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const imageData = `data:${req.file.mimetype};base64,${b64}`;

        const uploadResult = await cloudinary.uploader.upload(imageData, {
          folder: "Blogs",
          transformation: [
            { fetch_format: "auto", quality: "auto" },
            { width: 800, height: 600, crop: "auto", gravity: "auto" },
          ],
        });

        imageUrl = uploadResult.secure_url;
      }

      const blog = await Blog.findById(id);
      if (!blog) {
        return sendResponse(res, 404, null, true, "Blog not found");
      }

      const updates = {};
      if (title) updates.title = title;
      if (content) updates.content = content;
      if (tags) updates.tags = tags;
      //   if (service) updates.service = service;
      if (imageUrl) updates.image = imageUrl;

      const updatedBlog = await Blog.findByIdAndUpdate(id, updates, {
        new: true,
      });

      return sendResponse(
        res,
        200,
        updatedBlog,
        false,
        "Blog updated successfully"
      );
    } catch (err) {
      console.log("Edit Blog Error:", err);
      return sendResponse(res, 500, null, true, err.message);
    }
  }
);

router.get("/fetch3blog", async (req, res) => {
  try {
    const blog = await Blog.find().limit(3).sort({ createdAt: -1 });

    if (!blog) {
      return sendResponse(
        res,
        404,
        null,
        true,
        "No blog found for this service"
      );
    }

    return sendResponse(res, 200, blog, false, "Blog fetched successfully");
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/fetchAllBlogs", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(req.query.pageSize) || 20)
    );
    // No filter supplied: return all blogs. If you want filtering later, build a filter object.
    const filter = {};

    const [total, blogs] = await Promise.all([
      Blog.countDocuments(filter),
      Blog.find(filter)
        .populate("author", "userName email isAdmin")
        // .populate("service")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("-__v"),
    ]);

    return sendResponse(
      res,
      200,
      { blogs, meta: { total, page, pageSize } },
      false,
      "All blogs fetched successfully"
    );
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/fetchOneBlog/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, null, true, "Invalid Blog ID");
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return sendResponse(res, 404, null, true, "No blog found for this ID");
    }

    return sendResponse(res, 200, blog, false, "Blog fetched successfully");
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});


router.delete("/deleteBlog/:id", autheUser, isAdminCheck, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, null, true, "Invalid blog id");
    }

    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      return sendResponse(res, 404, null, true, "Blog not found");
    }

    // Attempt to delete image from Cloudinary if exists
    try {
      if (deletedBlog.image) {
        // extract public_id from Cloudinary url: segment after /upload/ and before extension
        const m = deletedBlog.image.match(
          /\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+(?:\?.*)?$/
        );
        if (m && m[1]) {
          await cloudinary.uploader.destroy(m[1]);
        }
      }
    } catch (cloudErr) {
      console.warn("Cloudinary delete failed:", cloudErr.message || cloudErr);
    }

    return sendResponse(
      res,
      200,
      deletedBlog,
      false,
      "Blog deleted successfully"
    );
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
