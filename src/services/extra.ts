import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import {
  IComment,
  ICourse,
  ICourseData,
  IReview,
} from "../models/course/courseTS";
import Course from "../models/course/courseModel";
import { deleteImg, uploadImg } from "../helpers/imgHandling";
import ApiError from "../middlewares/errors/apiError";
import { isValidId } from "../helpers/isValidId";
import redis from "../configs/redis";
import { IUser } from "../models/auth/authTS";

/**
 * Interface representing the request body for creating a new course.
 * @interface ICourseCreateRequest
 * @extends Request
 */
interface ICourseCreateRequest extends Request {
  body: ICourse;
}

/**
 * Create a new course.
 * @param {ICourseCreateRequest} req - The request object containing the course data in the body.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const createCourse = catchAsync(
  async (
    req: ICourseCreateRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Extract course data from the request body
    const data = req.body;

    // Check if thumbnail exists in the course data and upload it
    const thumbnail = data.thumbnail;
    if (thumbnail) {
      await uploadImg(data);
    }

    // Create a new course with the provided data
    const course = await Course.create(data);

    // Send a successful response with the created course
    res.status(201).json({
      status: true,
      message: "Course created successfully.",
      course,
    });
  }
);

/**
 * Interface representing the request body for updating a course.
 * @interface ICourseUpdateRequest
 * @extends Request
 */
interface ICourseUpdateRequest extends Request {
  body: ICourse;
}

/**
 * Update a course.
 * @param {ICourseUpdateRequest} req - The request object containing the course data in the body and course ID in the params.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const updateCourse = catchAsync(
  async (
    req: ICourseUpdateRequest,
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
    const course = await Course.findById(courseId);
    if (!course) {
      const error: ApiError = new ApiError(
        "Oh no! It seems like the course you're looking for doesn't exist",
        404
      );
      next(error);
      return;
    }

    // Check if the course has a thumbnail, and if so, delete it
    const thumbnail = data.thumbnail;
    if (thumbnail && course?.thumbnail?.public_id) {
      await deleteImg(course?.thumbnail?.public_id);
    }

    // If there's a new thumbnail provided, upload it
    if (thumbnail) {
      await uploadImg(data);
    }

    // Update the course with the new data
    const updatedCourse = await Course.findByIdAndUpdate(
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

/**
 * Interface representing the request for retrieving a single course.
 * @interface IGetSingleCourseRequest
 * @extends Request
 */
interface IGetSingleCourseRequest extends Request {
  course?: ICourse;
}

/**
 * Retrieve a single course.
 * @param {IGetSingleCourseRequest} req - The request object containing the course ID in the params.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const getSingleCourse = catchAsync(
  async (
    req: IGetSingleCourseRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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
      const courseFromDB = await Course.findById(courseId);
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

/**
 * Interface representing the request for retrieving all courses.
 */
interface IGetAllCourseRequest extends Request {
  course?: ICourse;
}

/**
 * Retrieve all courses.
 * @param {IGetAllCourseRequest} req - The request object.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const getAllCourse = catchAsync(
  async (
    req: IGetAllCourseRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Retrieve all courses from the database, excluding certain fields
    const courses = await Course.find().select(
      "-courseData.suggestion -courseData.questions -courseData.links"
    );

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

/**
 * Interface representing the request for retrieving user courses.
 */
interface IGetUserCoursesRequest extends Request {
  user?: IUser;
}

/**
 * Retrieve courses associated with a user.
 * @param {IGetUserCoursesRequest} req - The request object.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const getUserCourses = catchAsync(
  async (
    req: IGetUserCoursesRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Extract user and course ID from the request
    const user = req.user;
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
    const course = await Course.findById(courseId);
    const content = course?.courseData;

    // Send a successful response with the course content
    res.status(200).json({
      status: true,
      content,
    });
  }
);

/**
 * Interface representing the request for adding a question.
 */
interface IAddQuestionRequest extends Request {
  body: {
    question: string;
    courseId: string;
    contentId: string;
  };
  course?: ICourse;
  user?: IUser;
  courseData?: ICourseData;
}

/**
 * Add a question to a course content.
 * @param {IAddQuestionRequest} req - The request object.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const addQuestion = catchAsync(
  async (
    req: IAddQuestionRequest,
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
    const course = await Course.findById(courseId);
    if (!course) {
      const error: ApiError = new ApiError(
        "Oh no! The course you're looking for doesn't exist.",
        404
      );
      next(error);
      return;
    }

    // Find the course data based on the provided content ID
    const courseData: ICourseData | undefined = course?.courseData?.find(
      (item: any) => item._id.equals(contentId)
    );
    if (!courseData) {
      const error: ApiError = new ApiError(
        "Course content not found with this ID",
        404
      );
      next(error);
      return;
    }

    // Create a new question object
    const newQuestion: IComment = {
      user: req.user,
      question,
      questionReplies: [],
    };

    // Add the new question to the course data
    courseData?.questions?.push(newQuestion);

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

/**
 * Interface representing the request for adding an answer to a question.
 */
interface IAddQuestionAnswerRequest extends Request {
  body: {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
  };
  user?: IUser;
  course?: ICourse;
  question?: IComment;
  courseData?: ICourseData;
}

/**
 * Add an answer to a question in a course content.
 * @param {IAddQuestionAnswerRequest} req - The request object.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const addAnswer = catchAsync(
  async (
    req: IAddQuestionAnswerRequest,
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
    const course = await Course.findById(courseId);
    if (!course) {
      const error: ApiError = new ApiError(
        "Oh no! The course you're looking for doesn't exist.",
        404
      );
      next(error);
      return;
    }

    // Find the course data based on the provided content ID
    const courseData: ICourseData | undefined = course?.courseData?.find(
      (item: any) => item._id.equals(contentId)
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
    const question = courseData?.questions?.find((item: any) =>
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

    // Create a new answer object
    const newAnswer = {
      user: req.user,
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

/**
 * Interface representing the request for adding a review.
 */
interface IAddReviewRequest extends Request {
  body: {
    review: string;
    rating: number;
  };
  user?: IUser;
  course?: ICourse;
  reviewData?: IReview;
}

/**
 * Add a review to a course.
 * @param {IAddReviewRequest} req - The request object.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const addReview = catchAsync(
  async (
    req: IAddReviewRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const courseId: string = req.params.id;
    const user = req.user;
    const { review, rating } = req.body;

    // Validate the provided course ID
    if (!isValidId(courseId)) {
      const error: ApiError = new ApiError(
        "Oops! It seems like the course ID provided is invalid",
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
      user: req.user,
      comment: review,
      rating: Number(rating),
    };

    // Push the review data to the course's reviews array
    course?.reviews.push(reviewData);

    // Calculate the average rating of the course
    let avg = 0;
    course?.reviews.forEach((rev) => {
      avg += rev.rating ?? 0;
    });

    // Update the course's ratings
    if (course) {
      course.ratings = avg / course.reviews.length;
    }

    // Save the changes to the course
    await course?.save();

    // Send a successful response
    res.status(200).json({
      status: true,
      course,
    });
  }
);

/**
 * Interface representing the request for adding a reply to a review.
 */
interface IReviewReplayRequest extends Request {
  body: {
    comment: string;
    courseId: string;
    reviewId: string;
  };
  user?: IUser;
  course?: ICourse;
  reviewData?: IReview;
}

/**
 * Add a reply to a review.
 * @param {IReviewReplayRequest} req - The request object.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const addReplyReview = catchAsync(
  async (
    req: IReviewReplayRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { comment, courseId, reviewId } = req.body;

    // Validate the provided course ID
    if (!isValidId(courseId)) {
      const error: ApiError = new ApiError(
        "Oops! It seems like the course ID provided is invalid",
        400
      );
      next(error);
      return;
    }

    // Validate the provided review ID
    if (!isValidId(reviewId)) {
      const error: ApiError = new ApiError(
        "Oops! It seems like the review ID provided is invalid",
        400
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

    // Find the review data based on the provided review ID
    const reviewData = course?.reviews.find((rev: any) =>
      rev._id.equals(reviewId)
    );
    if (!reviewData) {
      const error: ApiError = new ApiError(
        "Oh no! The review you're looking for doesn't exist.",
        404
      );
      next(error);
      return;
    }

    // Create reply data object
    const replyData = {
      user: req.user,
      comment,
    };

    // Initialize commentReplies array if not exists
    if (!reviewData.commentReplies) {
      reviewData.commentReplies = [];
    }

    // Push the reply data to the review's commentReplies array
    reviewData.commentReplies.push(replyData);

    // Save the changes to the course
    await course?.save();

    // Send a successful response
    res.status(200).json({
      status: true,
      course,
    });
  }
);

/**
 * Interface representing the request for getting all courses by an admin.
 */
interface IGetAllCourseAdminRequest extends Request {
  course?: ICourse;
}

/**
 * Get all courses by an admin.
 * @param {IGetAllCourseAdminRequest} req - The request object.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const getAllCoursesByAdmin = catchAsync(
  async (
    req: IGetAllCourseAdminRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Find all courses and sort them by creation date in descending order
    const courses = await Course.find().sort({ createAt: -1 });

    // Check if there are no courses available
    if (!courses || courses.length === 0) {
      const error: ApiError = new ApiError(
        "Oops! It seems like there are no courses available at the moment. Please check back later or contact support for assistance.",
        404
      );
      next(error);
      return;
    }

    // Send a successful response with the list of courses
    res.status(200).json({
      status: true,
      length: courses.length,
      courses,
    });
  }
);

/**
 * Interface representing the request body for deleting a course by an admin.
 * @interface IDeleteCourseRequest
 * @extends Request
 */
interface IDeleteCourseRequest extends Request {
  course?: ICourse;
  user?: IUser;
}

/**
 * Deletes a course by an admin.
 * @param {IDeleteCourseRequest} req - The request object containing the course ID to delete.
 * @param {Response} res - The response object used to send the response.
 * @param {NextFunction} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} A promise indicating the completion of the operation.
 */
export const deleteCourseByAdmin = catchAsync(
  async (
    req: IDeleteCourseRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const courseId: string = req.params.id;
    const user = req.user;

    // Validate course ID
    if (!isValidId(courseId)) {
      const error: ApiError = new ApiError(
        "Oops! It seems like the course ID provided is invalid",
        400
      );
      next(error);
      return;
    }

    // Check if course is associated with the user
    const isCourseInUser: boolean | undefined = user?.courses?.some(
      (course: any) => course._id.equals(courseId)
    );
    if (!isCourseInUser) {
      const error: ApiError = new ApiError(
        "Oops! Course not found with this ID.",
        400
      );
      next(error);
      return;
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      const error: ApiError = new ApiError(
        "Oh no! The course you're looking for doesn't exist.",
        404
      );
      next(error);
      return;
    }

    // Delete the course
    await course.deleteOne({ courseId });

    // Delete course data from Redis cache
    await redis.del(courseId);

    // Send response
    res.status(204).json({
      status: true,
      message: "Course deleted successfully",
    });
  }
);
