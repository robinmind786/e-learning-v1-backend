import { Model } from "mongoose";
import { IReview } from "../models/review/reviewType";
import { catchAsync } from "../utils/catchAsync";
import { IAddReviewBodyRequest } from "./reviewType";
import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user/userType";
import ApiError from "../middlewares/errors/apiError";
import { isValidId } from "../helpers/isValidId";
import Course from "../models/course/courseModel";

class ReviewService {
  private readonly Model: Model<IReview>;
  constructor(Model: Model<IReview>) {
    this.Model = Model;
  }

  createReview = catchAsync(
    async (
      req: IAddReviewBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { review, rating, userId, courseId } = req.body;

      // Check if the provided course ID is valid
      if (!isValidId(userId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the user ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      if (!isValidId(courseId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the course ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Get the user from the request object
      const user = req.user as IUser;

      if (!user) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      // Check if the user is eligible to access the course
      const isCourse = user?.courses?.find((course: any) =>
        course._id.equals(courseId)
      );
      if (!isCourse) {
        const error: ApiError = new ApiError(
          "You are not eligible to access this course",
          404
        );
        next(error);
        return;
      }

      // Find the course based on the provided course ID
      const course = await Course.findById(courseId);
      if (!course) {
        const error: ApiError = new ApiError(
          "Oh no! The course you're looking for doesn't exist.",
          404
        );
        next(error);
        return;
      }

      // Create a review data object
      const reviewData = {
        user: user._id,
        course: course._id,
        rating: Number(rating),
        review,
      };

      // Create a new course with the provided data
      const newReview = await this.Model.create(reviewData);

      // Send a successful response with the created course
      res.status(201).json({
        status: true,
        message: "Course created successfully.",
        newReview,
      });
    }
  );

  getSingleReview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const reviewId = req.params.id;

      // Check if the provided course ID is valid
      if (!isValidId(reviewId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the review ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      const review = await this.Model.findById(reviewId);

      if (!review) {
        // If the course is not found in the database, send an error response
        const error: ApiError = new ApiError(
          "Oh no! The review you're looking for doesn't exist.",
          404
        );
        next(error);
        return;
      }

      res.status(200).json({
        status: true,
        message: "Review retrieved successfully.",
        review,
      });
    }
  );
}

export default ReviewService;
