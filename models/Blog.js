import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },

    content: {
      type: String,
      required: true,
      minlength: 20,
    },

    image: {
      type: String,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
