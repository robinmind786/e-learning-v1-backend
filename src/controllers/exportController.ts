import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import User from "../models/user/userModel";
import ApiError from "../middlewares/errors/apiError";
import { updateSheetData } from "../helpers/googleSheet";

export const exportUserGSheet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionUsers = await User.find()
      .sort({ createAt: -1 })
      .select("+password +isVerified +isSocial");

    if (!sessionUsers || sessionUsers.length === 0) {
      const error: ApiError = new ApiError(
        "Oops! It seems like there are no users available at the moment. Please check back later or contact support for assistance.",
        404
      );
      next(error);
      return;
    }

    const values = sessionUsers.map((user) => [
      user._id,
      user.fname,
      user.lname,
      user.email,
      user.password,
      user.role,
      user.isVerified ? "Verified" : "Not Verified",
      user.isSocial ? "Social" : "Not Social",
      user.createdAt,
      user.updatedAt,
    ]);

    await updateSheetData({
      range: `Users!A2:Z`,
      inputOption: "RAW",
      values,
    });

    // Send response
    res.status(201).json({
      status: true,
      message: "User data exported successfully",
    });
  }
);
