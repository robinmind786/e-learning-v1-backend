import { Model } from "mongoose";
import { IComment, ICommentReply, ICourse } from "../models/course/courseType";
import { catchAsync } from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import {
  IAddQuestionAnswerBodyRequest,
  IAddQuestionBodyRequest,
  ICourseBodyRequest,
  ICourseUpdateBodyRequest,
} from "./courseType";
import { IUser } from "../models/user/userType";
import ApiError from "../middlewares/errors/apiError";
import { deleteImg, uploadImg } from "../helpers/fileHandling";
import { isValidId } from "../helpers/isValidId";
import redis from "../config/ioredis";

class CourseService {
  private readonly Model: Model<ICourse>;
  constructor(Model: Model<ICourse>) {
    this.Model = Model;
  }

  createCourse = catchAsync(
    async (
      req: ICourseBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Extract course data from the request body
      const data = req.body;

      // Check if thumbnail exists in the course data and upload it
      const thumbnail = data.courseDetails.thumbnail;

      if (thumbnail) {
        await uploadImg(data.courseDetails);
      }

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

      //   Prepare create data
      const prepareData = {
        ...data,
        instructor: user._id,
      };

      // Create a new course with the provided data
      const course = await this.Model.create(prepareData);

      // Send a successful response with the created course
      res.status(201).json({
        status: true,
        message: "Course created successfully.",
        course,
      });
    }
  );

  updateCourse = catchAsync(
    async (
      req: ICourseUpdateBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Extract course data from the request body
      const data = req.body;
      const courseId: string = req.params.id;

      // Check if the provided course ID is valid
      if (!isValidId(courseId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the course ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Find the course by its ID
      const course = await this.Model.findById(courseId);
      if (!course) {
        const error: ApiError = new ApiError(
          "Oh no! It seems like the course you're looking for doesn't exist",
          404
        );
        next(error);
        return;
      }

      // Check if the course has a thumbnail, and if so, delete it
      const thumbnail = data.courseDetails.thumbnail;
      if (thumbnail && course?.courseDetails.thumbnail?.public_id) {
        await deleteImg(course?.courseDetails.thumbnail?.public_id);
      }

      // If there's a new thumbnail provided, upload it
      if (thumbnail) {
        await uploadImg(data.courseDetails);
      }

      // Update the course with the new data
      const updatedCourse = await this.Model.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      // Send a successful response with the updated course
      res.status(200).json({
        status: true,
        message: "Course updated successfully.",
        course: updatedCourse,
      });
    }
  );

  getSingleCourse = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Extract the course ID from the request parameters
      const courseId: string = req.params.id;

      // Check if the provided course ID is valid
      if (!isValidId(courseId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the course ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Check if the course is available in the Redis cache
      const courseFromRedis: string | null = await redis.get(courseId);

      // If the course is found in the cache, send the cached course
      if (courseFromRedis) {
        const course = JSON.parse(courseFromRedis) as ICourse;
        res.status(200).json({
          status: true,
          message: "Course retrieved successfully from the cache.",
          course,
        });
      } else {
        // If the course is not found in the cache, retrieve it from the database
        const courseFromDB = await this.Model.findById(courseId).populate({
          path: "reviews",
          select: "-course",
        });

        if (!courseFromDB) {
          // If the course is not found in the database, send an error response
          const error: ApiError = new ApiError(
            "Oh no! The course you're looking for doesn't exist.",
            404
          );
          next(error);
          return;
        }

        // Store the retrieved course in the Redis cache
        await redis.set(courseId, JSON.stringify(courseFromDB));

        // Send a successful response with the retrieved course
        res.status(200).json({
          status: true,
          message: "Course retrieved successfully.",
          course: courseFromDB,
        });
      }
    }
  );

  getAllCourse = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Retrieve all courses from the database, excluding certain fields
      const courses = await this.Model.find().select("-lectures");

      // If no courses are found, send an error response
      if (!courses || courses.length === 0) {
        const error: ApiError = new ApiError(
          "Oops! It seems like there are no courses available at the moment. Please check back later or contact support for assistance.",
          404
        );
        next(error);
        return;
      }

      // Store the list of courses in the Redis cache
      await redis.set("allCourses", JSON.stringify(courses));

      // Send a successful response with the list of courses
      res.status(200).json({
        status: true,
        length: courses.length,
        courses,
      });
    }
  );

  getUserCourses = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Extract user and course ID from the request
      const user = req.user as IUser;
      const courseId = req.params.id;

      // Validate the course ID
      if (!isValidId(courseId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the course ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Check if the course is associated with the user
      const isCourseInUser = user?.courses?.find((course: any) =>
        course._id.equals(courseId)
      );

      if (!isCourseInUser) {
        const error: ApiError = new ApiError(
          "You are not eligible to access this course",
          400
        );
        next(error);
        return;
      }

      // Retrieve the course from the database based on the provided ID
      const course = await this.Model.findById(courseId);
      const content = course?.courseDetails;

      // Send a successful response with the course content
      res.status(200).json({
        status: true,
        content,
      });
    }
  );

  addQuestion = catchAsync(
    async (
      req: IAddQuestionBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { question, courseId, contentId } = req.body;

      // Validate the provided course ID
      if (!isValidId(courseId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the course ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Validate the provided content ID
      if (!isValidId(contentId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the content ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Find the course based on the provided course ID
      const course = await this.Model.findById(courseId);

      if (!course) {
        const error: ApiError = new ApiError(
          "Oh no! The course you're looking for doesn't exist.",
          404
        );
        next(error);
        return;
      }

      // Find the course data based on the provided content ID
      const courseData = course.lectures.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseData) {
        const error: ApiError = new ApiError(
          "Course content not found with this ID",
          404
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

      // Create a new question object
      const newQuestion: IComment = {
        user,
        question,
        questionReplies: [],
      };

      // Add the new question to the course data
      courseData?.comments?.push(newQuestion);

      // Save the course changes
      await course?.save();

      // Send a successful response
      res.status(201).json({
        status: true,
        message: "Question added successfully.",
        course,
      });
    }
  );

  addAnswer = catchAsync(
    async (
      req: IAddQuestionAnswerBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { answer, courseId, contentId, questionId } = req.body;

      // Validate the provided course ID
      if (!isValidId(courseId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the course ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Validate the provided content ID
      if (!isValidId(contentId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the content ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Validate the provided question ID
      if (!isValidId(questionId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the question ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Find the course based on the provided course ID
      const course = await this.Model.findById(courseId);
      if (!course) {
        const error: ApiError = new ApiError(
          "Oh no! The course you're looking for doesn't exist.",
          404
        );
        next(error);
        return;
      }

      // Find the course data based on the provided content ID
      const courseData = course?.lectures?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseData) {
        const error: ApiError = new ApiError(
          "Course content not found with this ID",
          404
        );
        next(error);
        return;
      }

      // Find the question based on the provided question ID
      const question = courseData?.comments?.find((item: any) =>
        item._id.equals(questionId)
      );
      if (!question) {
        const error: ApiError = new ApiError(
          "Course question not found with this ID",
          404
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

      // Create a new answer object
      const newAnswer: ICommentReply = {
        user,
        answer,
      };

      // Add the new answer to the question
      question?.questionReplies?.push(newAnswer);

      // Save the course changes
      await course?.save();

      // Send a successful response
      res.status(200).json({
        status: true,
        course,
      });
    }
  );
}

export default CourseService;
