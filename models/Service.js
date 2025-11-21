import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2 },
    description: { type: String, required: true, minlength: 10 },
    image: { type: String },
    imagePublicId: { type: String },
    // price: { type: Number, min: 0 },
    category: {
      type: [String],
      required: true,
    },

    pricingPlans: {
      basic: {
        price: { type: Number, required: true, min: 0 },
        features: { type: [String], default: [] },
      },
      standard: {
        price: { type: Number, required: true, min: 0 },
        features: { type: [String], default: [] },
      },
      premium: {
        price: { type: Number, required: true, min: 0 },
        features: { type: [String], default: [] },
      },
    },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);
export default Service;
