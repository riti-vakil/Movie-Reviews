import mongoose, { Schema } from "mongoose";
import modelOptions from "./model.options.js";

export default mongoose.model(
  "Streams",
  mongoose.Schema({
    mediaType: {
      type: String,
      enum: ["tv", "movie"],
      required: true
    },
    mediaId: {
      type: String,
      required: true
    },
    mediaTitle: {
      type: String,
      required: true
    },
    services: {
      type: [String],
      required: true 
    },
    prices: {
      type: [String],
      required: true
    },
  }, modelOptions)
);