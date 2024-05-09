import { model, Schema } from "mongoose";
import {
  IBenefits,
  IComment,
  ICourse,
  ICourseDetails,
  Ilectures,
  ILink,
  IPrerequisites,
  IVideo,
} from "./courseType";

const benefitsSchema = new Schema<IBenefits>({
  title: { type: String, required: [true, "🌟 Benefit title is required"] },
  description: {
    type: String,
    required: [true, "📝 Benefit description is required"],
  },
});

const prerequisitesSchma = new Schema<IPrerequisites>({
  title: {
    type: String,
    required: [true, "🌟 Prerequisite title is required"],
  },
  description: {
    type: String,
    required: [true, "📝 Prerequisite description is required"],
  },
});

const courseDetails = new Schema<ICourseDetails>({
  title: {
    type: String,
    required: [true, "🌟 Title is required"],
    trim: true,
  },
  thumbnail: {
    public_id: {
      type: String,
      required: [true, "🖼️ Thumbnail public ID is required"],
    },
    url: { type: String, required: [true, "🌟 Thumbnail URL is required"] },
  },
  shortDescription: {
    type: String,
    required: [true, "🌟 Short description is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "🌟 Description is required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "💰 Price is required"],
    min: [0, "💰 Price cannot be negative"],
  },
  disPrice: {
    type: Number,
    required: [true, "💰 Discounted price is required"],
    min: [0, "💰 Discounted price cannot be negative"],
    validate: {
      validator: function (this: ICourseDetails, value: number): boolean {
        return value <= this.price;
      },
      message: "💰 Discounted price must be less than or equal to the price",
    },
  },
  duration: {
    type: Number,
    required: [true, "⏰ Duration is required"],
    min: [0, "⏰ Duration cannot be negative"],
  },
  category: {
    type: String,
    required: [true, "📂 Category is required"],
  },
  level: {
    type: String,
    required: [true, "📊 Level is required"],
    enum: {
      values: ["Beginner", "Intermediate", "Advanced"],
      message: "🚫 Invalid course level",
    },
  },
  language: {
    type: String,
    required: [true, "🗣️ Language is required"],
  },
  featured: {
    type: Boolean,
    default: false,
  },
  videoLength: {
    type: String,
    required: [true, "🎥 Video length is required"],
  },
  totalLecture: {
    type: Number,
    required: [true, "📚 Total lecture count is required"],
    min: [0, "📚 Total lecture count cannot be negative"],
  },
  purchased: {
    type: Number,
    default: 0,
  },
  tags: {
    type: [String],
    required: [true, "🏷️ Tags are required"],
  },
});

const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.ObjectId,
      ref: "User",
    },
    question: String,
    questionReplies: [
      {
        user: {
          type: Schema.ObjectId,
          ref: "User",
        },
        answer: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const videoLinkSchema = new Schema<ILink>({
  title: { type: String, required: [true, "📹 Video link title is required"] },
  url: { type: String, required: [true, "📹 Video link URL is required"] },
});

const videoDetailSchema = new Schema<IVideo>({
  title: { type: String, required: [true, "🎥 Video title is required"] },
  description: {
    type: String,
    required: [true, "🎥 Video description is required"],
  },
  url: { type: String, required: [true, "🎥 Video URL is required"] },
  links: [videoLinkSchema],
});

const lecturesSchema = new Schema<Ilectures>({
  videoUrl: {
    type: [videoDetailSchema],
    required: [true, "🎥 Video details are required"],
  },
  videoSection: {
    type: String,
    required: [true, "📹 Video section is required"],
  },
  comments: [commentSchema],
  suggestions: String,
});

const courseSchema = new Schema<ICourse>(
  {
    courseDetails,
    benefits: [benefitsSchema],
    prerequisites: [prerequisitesSchma],
    lectures: [lecturesSchema],
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "👨‍🏫 Instructor ID is required"],
    },
    users: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate
courseSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "course",
  localField: "_id",
});

courseSchema.pre(/^find/, function (next) {
  this.populate({
    path: "instructor",
    select: "-__v -email -role -courses -createdAt -updatedAt",
  })
    .populate({
      path: "lectures.comments.user",
      select: "-__v -email -role -courses -createdAt -updatedAt",
    })
    .populate({
      path: "lectures.comments.questionReplies.user",
      select: "-__v -email -role -courses -createdAt -updatedAt",
    });

  next();
});

const Course = model<ICourse>("Course", courseSchema);
export default Course;
