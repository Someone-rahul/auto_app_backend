import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    // addedBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    // },
  },
  { timestamps: true }
);
export const Blog = mongoose.model("Blog", blogSchema);
