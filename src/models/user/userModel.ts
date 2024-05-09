import { Schema, model } from "mongoose";
import { compare, hash } from "bcryptjs";
import { IUser, IUserEducation, IUserSocialProfile } from "./userType";
import { jwtCreator } from "../../helpers/jwtCreator";

const eductionSchema = new Schema<IUserEducation>({
  name: {
    type: String,
  },
});

const socialProfileSchema = new Schema<IUserSocialProfile>({
  name: {
    type: String,
  },
  url: {
    type: String,
  },
});

const userSchema = new Schema<IUser>(
  {
    fname: {
      type: String,
      trim: true,
      required: [true, "First name is required"],
    },
    lname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: Number,
    },
    bio: {
      type: String,
    },
    location: {
      type: String,
    },
    protfilo: {
      type: String,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: {
      type: String,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
    isSocial: {
      type: Boolean,
      default: false,
      select: false,
    },
    education: [eductionSchema],
    socialProfile: [socialProfileSchema],
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populated

// Middleware: Hash the password before saving
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      next();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const hashedPassword = await hash(this.password ?? "", 14);
    this.password = hashedPassword;

    next();
  } catch (error: unknown) {
    next(error as Error);
  }
});

// Method: Compare candidate password with stored hashed password
userSchema.methods.correctPassword = async function (
  this: IUser,
  providePassword: string
) {
  return await compare(providePassword, this.password ?? "");
};

userSchema.methods.signAccessToken = function (this: IUser) {
  return jwtCreator(
    { id: this._id },
    process.env.ACCESS_TOKEN ?? "",
    process.env.ACCESS_TOKEN_EXPIRE ?? "5m"
  );
};

userSchema.methods.signRefreshToken = function (this: IUser) {
  return jwtCreator(
    { id: this._id },
    process.env.REFRESH_TOKEN ?? "",
    process.env.REFRESH_TOKEN_EXPIRE ?? "3d"
  );
};

const User = model<IUser>("User", userSchema);
export default User;
