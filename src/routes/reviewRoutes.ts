import express from "express";
import validationMiddleware from "../middlewares/validations/validationSchemas";
import { runSchema } from "../middlewares/validations/runSchema";
import authController from "../controllers/authController";
import reviewController from "../controllers/reviewController";
const router = express.Router();

router.post(
  "/create",
  validationMiddleware.reviewValidationSchema,
  runSchema,
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin", "user"),
  reviewController.createReview
);

router.get("/get-reivew/:id", reviewController.getSingleReview);

export default router;
