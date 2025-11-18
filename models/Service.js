import mongoose from "mongoose";


const serviceSchema = new mongoose.Schema({
  title: { type: String, require: true },
  description: { type: String, required: true },
  image: { type: String }, // URL
  price: { type: Number },
  category: {
    type: [String],
    // enum: ["Frontend", "Backend"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;