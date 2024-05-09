import express from "express";
import { ensureEnvVariables } from "../helpers/getEnvVariable";
import validationMiddleware from "../middlewares/validations/validationSchemas";
import { runSchema } from "../middlewares/validations/runSchema";
import authController from "../controllers/authController";
const router = express.Router();

router.post(
  "/signup",
  ensureEnvVariables(["ACTIVATION_SECRET"]),
  validationMiddleware.userSignupSchema,
  runSchema,
  authController.signup
);

router.post(
  "/activation",
  ensureEnvVariables(["ACTIVATION_SECRET"]),
  validationMiddleware.userActivation,
  runSchema,
  authController.activation
);

router.post(
  "/signin",
  validationMiddleware.userSigninSchema,
  runSchema,
  authController.signin
);

router.get(
  "/logout",
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.logout
);

router.get(
  "/update-token",
  ensureEnvVariables(["REFRESH_TOKEN", "ACCESS_TOKEN"]),
  authController.updateAccessToken
);

router.get("/me", authController.isAuthenticated, authController.getUserInfo);

router.patch(
  "/update-user-info",
  validationMiddleware.userUpdatSchema,
  runSchema,
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.updateUserInfo
);

router.patch(
  "/update-user-password",
  validationMiddleware.updateUserPasswordSchema,
  runSchema,
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.updateUserPassword
);

router.patch(
  "/update-user-role/:id",
  validationMiddleware.userRoleUpdate,
  runSchema,
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin"),
  authController.updateUserRole
);

router.get(
  "/get-users",
  authController.updateAccessToken,
  authController.isAuthenticated,
  authController.restrictTo("admin"),
  authController.getAllUser
);

export default router;
