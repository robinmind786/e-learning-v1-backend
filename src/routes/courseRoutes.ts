import express from "express";
import authController from "../controllers/authController";
import courseController from "../controllers/courseController";
import validationMiddleware from "../middlewares/validations/validationSchemas";
import { runSchema } from "../middlewares/validations/runSchema";
const router = express.Router();

router.post(
  "/create",
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin", "instructor"),
  courseController.createCourse
);

router.patch(
  "/update/:id",
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin", "instructor"),
  courseController.updateCourse
);

router.get("/get-one/:id", courseController.getSingleCourse);

router.get("/get-all/", courseController.getAllCourse);

router.get(
  "/user-courses/:id",
  authController.isAuthenticated,
  authController.restrictTo("user", "admin"),
  courseController.getUserCourses
);

router.patch(
  "/add-question",
  validationMiddleware.questionValidationSchema,
  runSchema,
  authController.isAuthenticated,
  authController.restrictTo("user", "admin"),
  courseController.addQuestion
);

router.patch(
  "/add-answer",
  validationMiddleware.answerValidationSchema,
  runSchema,
  authController.isAuthenticated,
  authController.restrictTo("user", "admin"),
  courseController.addAnswer
);

export default router;
