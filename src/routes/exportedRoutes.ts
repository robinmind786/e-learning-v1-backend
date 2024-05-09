import express from "express";
import authController from "../controllers/authController";
import { exportUserGSheet } from "../controllers/exportController";
const router = express.Router();

router.post(
  "/users",
  authController.isAuthenticated,
  authController.restrictTo("admin"),
  exportUserGSheet
);

export default router;
