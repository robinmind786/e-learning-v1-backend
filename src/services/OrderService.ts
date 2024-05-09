import { Model } from "mongoose";
import { IOrder } from "../models/order/orderType";
import { catchAsync } from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user/userType";
import ApiError from "../middlewares/errors/apiError";
import User from "../models/user/userModel";
import Course from "../models/course/courseModel";

class OrderService {
  private readonly Model: Model<IOrder>;
  constructor(Model: Model<IOrder>) {
    this.Model = Model;
  }

  createOrder = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Extract courseId from request body
      const { courseId } = req.body;

      // Get the user  from the request object
      const user = req.user as IUser;

      if (!user) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      const sessionUser = await User.findById(user._id);

      if (!sessionUser) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      // Check if the course is already purchased by the user
      const isCourseInUser =
        sessionUser?.courses &&
        sessionUser?.courses.some(
          (course) => course._id.toString() === courseId.toString()
        );

      // If the course is already purchased, return an error
      if (isCourseInUser) {
        const error: ApiError = new ApiError(
          "You have already purchased this course",
          400
        );
        next(error);
        return;
      }

      // Find the course by id
      const course = await Course.findById(courseId);

      // If course is not found, return an error
      if (!course) {
        const error: ApiError = new ApiError("Course not found", 404);
        next(error);
        return;
      }

      // Add the course to user's courses
      if (sessionUser.courses) {
        sessionUser?.courses.push(course._id);
        await sessionUser?.save();
      }

      res.status(200).json({
        status: true,
        message: "Order created successfully.",
      });
    }
  );
}

export default OrderService;
