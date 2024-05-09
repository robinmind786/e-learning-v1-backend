import { model, Schema } from "mongoose";
import { IReview } from "./reviewType";

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating cannot be less than 1"],
      max: [5, "Rating cannot be greater than 5"],
    },
    review: String,
    reviewReplies: [
      {
        user: {
          type: Schema.ObjectId,
          ref: "User",
        },
        reply: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "-__v -email -role -courses -createdAt -updatedAt",
  }).populate({
    path: "course",
    select: "-__v",
  });

  next();
});

const Review = model<IReview>("Review", reviewSchema);
export default Review;
