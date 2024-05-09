import { model, Schema } from "mongoose";
import { ICategory } from "./categoryType";

const categorySchema = new Schema<ICategory>(
  {
    value: {
      type: String,
      required: [true, "Value is required"],
    },
    thumbnail: {
      public_id: {
        type: String,
        required: [true, "Thumbnail public ID is required"],
      },
      url: { type: String, required: [true, "Thumbnail URL is required"] },
    },
    isActive: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const Category = model<ICategory>("Category", categorySchema);
export default Category;
