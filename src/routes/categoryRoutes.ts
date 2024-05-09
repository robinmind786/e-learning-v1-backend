import express from "express";
import authController from "../controllers/authController";
import categoryController from "../controllers/categoryController";
const router = express.Router();

router.post(
  "/create",
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin"),
  categoryController.create
);

router.get("/get-all", categoryController.getAll("user"));

router.get(
  "/get-all-admin",
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin"),
  categoryController.getAll("admin")
);

export default router;
