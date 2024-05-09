import express from "express";
import orderController from "../controllers/orderController";
import authController from "../controllers/authController";
const router = express.Router();

router.post(
  "/create",
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin", "user"),
  orderController.createOrder
);

export default router;
