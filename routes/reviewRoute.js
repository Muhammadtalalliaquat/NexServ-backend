import express from "express";
import Review from "../models/review.js";
import sendResponse from "../helpers/Response.js";
import { autheUser, isAdminCheck } from "../middleware/authUser.js";
import Joi from "joi";

const router = express.Router();

const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().min(3).required(),
});

router.post("/addReview", autheUser, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const { error } = reviewSchema.validate({ rating, comment });
    if (error) {
      return sendResponse(res, 400, null, true, error.details[0].message);
    }

    if (!rating || !comment) {
      return sendResponse(res, 400, null, true, "All fields are required.");
    }

    let review = await Review.findOne({
      author: req.user._id,
    });

    if (review) {
      review.rating = rating;
      review.comment = comment;
    } else {
      review = new Review({
        author: req.user._id.toString(),
        rating,
        comment,
        createdAt: new Date(),
      });
    }

    await review.save();

    const updateReviews = await Review.find();

    const avgRating =
      updateReviews.reduce((acc, review) => acc + review.rating, 0) /
      updateReviews.length;

    console.log("review data here", avgRating);

    sendResponse(res, 200, updateReviews, false, "Review submitted");
  } catch (error) {
    sendResponse(res, 500, null, true, error.message);
  }
});

router.get("/getReview", async (req, res) => {
  try {
      const review = await Review.find()
      .sort({ createdAt: -1 })
      .populate("author", "userName email")

    if (!review) {
      return sendResponse(
        res,
        404,
        null,
        true,
        "No review found for this service"
      );
    }

    return sendResponse(res, 200, review, false, "Review fetched successfully");
  } catch (error) {
    return sendResponse(res, 500, null, true, error.message);
  }
});

export default router;
