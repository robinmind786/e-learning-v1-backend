/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user/userType";
import ApiError from "../middlewares/errors/apiError";
import { Model } from "mongoose";
import { decrypt, encrypt, EncryptedData } from "../security/crypto";
import SendEmail from "../utils/SendEmail";
import {
  DecodedJwtPayload,
  IActivationBodyRequest,
  ISigninBodyRequest,
  ISignupBodyRequest,
  IUpdatePasswordBodyRequest,
  IUpdateUserBodyRequest,
  IUpdateUserRoleBodyRequest,
  IUserOAuthRequest,
  Role,
} from "./authType";
import redis from "../config/ioredis";
import {
  accessTokenOptions,
  refreshTokenOptions,
} from "../utils/cookieOptions";
import { catchAsync } from "../utils/catchAsync";
import Utils from "../helpers/Utils";
import { JwtPayload } from "jsonwebtoken";

class Authenticator extends Utils {
  private readonly Model: Model<IUser>;
  constructor(Model: Model<IUser>) {
    super();
    this.Model = Model;
  }

  async sessionToken(
    user: IUser,
    statusCode: number,
    res: Response,
    next: NextFunction,
    redirectURL?: string
  ): Promise<void> {
    user.password = undefined;

    const accessToken: string | undefined = user.signAccessToken?.();
    const refreshToken: string | undefined = user.signRefreshToken?.();

    const userCacheId = this.redisKey(user._id);
    if (!userCacheId) {
      const error: ApiError = new ApiError(
        "Please login to access this resource",
        400
      );
      next(error);
      return;
    }
    await redis.set(userCacheId, JSON.stringify(user));

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    if (redirectURL) {
      res.redirect(redirectURL);
    } else {
      res.status(statusCode).json({
        success: true,
        message: `Welcome back ${user.fname}.`,
        user,
        accessToken,
      });
    }
  }

  isAuthenticated = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const accessToken: string | undefined = req.cookies.access_token;

      // Check if access token is provided
      if (!accessToken) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      const accessTokenSecret: string = this.getEnvVariable(
        "ACCESS_TOKEN",
        "Access token secret is not provided."
      );

      // Verify the access token
      const decoded = this.jwtVerifier(accessToken, accessTokenSecret);

      // Check if token is valid
      if (!decoded) {
        const error: ApiError = new ApiError("Access token is not valid", 400);
        next(error);
        return;
      }

      // Find user by ID from decoded token
      const user = await this.Model.findById(decoded.id);

      // Check if user exists
      if (!user) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      // Set user in request object
      req.user = user;

      next();
    }
  );

  restrictTo = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = req.user as IUser;
      if (!roles.includes(user?.role)) {
        const error = new ApiError(
          "You do not have permission to perform this action",
          403
        );
        next(error);
        return;
      }

      next();
    };
  };

  signup = catchAsync(
    async (
      req: ISignupBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { fname, lname, email, password } = req.body;

      // Check if all required fields are provided
      if (!fname || !lname || !email || !password) {
        const error: ApiError = new ApiError(
          "Please provide values for all required fields: first name, last name, email, and password.",
          400
        );
        next(error);
        return;
      }

      // Check if email is already taken
      const isEmail = await this.Model.findOne({ email });
      if (isEmail) {
        const error: ApiError = new ApiError(
          "Email is already taken. Please use a different email address.",
          400
        );
        next(error);
        return;
      }

      // Retrieve activation secret from environment variables using getEnvVariable
      const activationSecret = this.getEnvVariable(
        "ACTIVATION_SECRET",
        "Activation secret is not defined."
      );

      // Generate OTP for account verification
      const user = {
        fname,
        lname,
        email,
        password: encrypt(password, process.env.CRYPTO_SECRET ?? ""),
      };

      const verificationInfo = this.otpGenerator(user, activationSecret);

      if (!verificationInfo) {
        const error: ApiError = new ApiError(
          "There was an error generating the verification code. Please try again later.",
          500
        );
        next(error);
        return;
      }

      // Extract token and OTP from verification info
      const { token, otp } = verificationInfo;

      // Prepare email data for sending verification code
      const emailData = {
        user: {
          name: this.capitalize(user?.fname),
          email: user?.email,
        },
        otp,
      };

      // Send verification email
      await new SendEmail(emailData)
        .verifyAccount()
        .then(() => {
          res.status(200).json({
            success: true,
            message: "Verification code sent successfully to your email.",
            token,
          });
        })
        .catch(() => {
          const error = new ApiError(
            "There was an error sending the email. Please try again later!",
            500
          );
          next(error);
        });
    }
  );

  activation = catchAsync(
    async (
      req: IActivationBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const { activationToken, otp } = req.body;

      // Check if verification code is provided
      if (!otp) {
        const error: ApiError = new ApiError(
          "Verification code is required. Please enter the code to proceed.",
          400
        );
        next(error);
        return;
      }

      // Check if activation token is provided
      if (!activationToken) {
        const error: ApiError = new ApiError(
          "Invalid activation token. Please try again.",
          400
        );
        next(error);
        return;
      }

      const activationSecret: string = this.getEnvVariable(
        "ACTIVATION_SECRET",
        "Activation secret is not defined."
      );

      // Verify the activation token
      const decoded = this.jwtVerifier(
        activationToken,
        activationSecret
      ) as DecodedJwtPayload;

      // Check if activation token is valid
      if (!decoded) {
        const error: ApiError = new ApiError(
          "Invalid activation token. Please try again.",
          400
        );
        next(error);
        return;
      }

      // Check if provided OTP matches the decoded OTP
      const decodedOTP: number = Number(decoded.otp);
      const providedOTP: number = Number(otp);

      if (decodedOTP !== providedOTP) {
        const error: ApiError = new ApiError(
          "Invalid verification code. Please double-check the code and try again.",
          400
        );
        next(error);
        return;
      }

      // Extract user details from decoded payload
      const { fname, lname, email, password } = decoded.payload;

      // Check if email is already registered
      const isEmail = await this.Model.findOne({ email });
      if (isEmail) {
        const error = new ApiError(
          "Email is already registered. Please use a different email address.",
          400
        );
        next(error);
        return;
      }

      // Create a new user with verified status
      const newUser = await this.Model.create({
        fname: this.capitalize(fname),
        lname: this.capitalize(lname),
        email,
        password: decrypt(
          password as unknown as EncryptedData,
          process.env.CRYPTO_SECRET ?? ""
        ),
        isVerified: true,
      });

      // Send success response
      res.status(201).json({
        success: true,
        newUser,
        message: `Congratulations, ${this.capitalize(
          fname
        )}! Your account has been successfully activated.`,
      });
    }
  );

  signin = catchAsync(
    async (req: ISigninBodyRequest, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      // Check if email and password are provided
      if (!email || !password) {
        const error: ApiError = new ApiError(
          "Please provide your email and password.",
          400
        );
        next(error);
        return;
      }

      // Find user by email
      const user = await this.Model.findOne({ email })
        .select("+password")
        .populate("courses")
        .exec();

      if (!user) {
        const error: ApiError = new ApiError(
          "Incorrect email or password. Please check your credentials and try again.",
          401
        );
        next(error);
        return;
      }

      // Check if user object has correctPassword method
      if (!user.correctPassword || typeof user.correctPassword !== "function") {
        let errorMessage: string =
          "Internal server error. Please try again later.";
        if (process.env.NODE_ENV === "development") {
          errorMessage =
            "Internal server error. correctPassword method not found on user object.";
        }
        const error: ApiError = new ApiError(errorMessage, 500);
        next(error);
        return;
      }

      // Check if provided password is correct
      const isPasswordCorrect: boolean = await user.correctPassword(password);
      if (!isPasswordCorrect) {
        const error: ApiError = new ApiError(
          "Incorrect email or password. Please check your credentials and try again.",
          401
        );
        next(error);
        return;
      }

      await this.sessionToken(user, 200, res, next);
    }
  );

  oauth = (type: "google" | "github") =>
    catchAsync(
      async (
        req: IUserOAuthRequest,
        res: Response,
        next: NextFunction
      ): Promise<void> => {
        if (type === "google") {
          // Extracting user data from the request object
          const {
            given_name: giveName,
            family_name: familyName,
            email,
            picture,
            email_verified: isVerified,
          } = req.user?._json;

          const data = {
            fname: giveName,
            lname: familyName,
            email,
            avatar: {
              url: picture,
            },
            isVerified,
            isSocial: true,
          };

          // Check if user exists in the database
          const isUserDB = await this.Model.findOne({ email });

          // Define redirect URL
          const redirectURL = process.env.CLIENT_URL
            ? process.env.CLIENT_URL.toString()
            : "/";

          // If user doesn't exist in the database, create a new user
          if (!isUserDB) {
            const newUser = await this.Model.create(data);
            await this.sessionToken(newUser, 200, res, next, redirectURL);
          } else {
            // If user exists, generate session token
            await this.sessionToken(isUserDB, 200, res, next, redirectURL);
          }
        } else if (type === "github") {
          const { name, login, avatar_url: avatarURL } = req.user?._json;

          // Constructing user data object
          const data = {
            fname: name.split(" ")[0],
            lname: name.split(" ")[1],
            email: login,
            avatar: {
              url: avatarURL,
            },
            isVerified: true,
            isSocial: true,
          };

          // Check if user exists in the database
          const isUserDB = await this.Model.findOne({ email: login });

          // Define redirect URL
          const redirectURL = process.env.CLIENT_URL
            ? process.env.CLIENT_URL.toString()
            : "/";

          // If user doesn't exist in the database, create a new user
          if (!isUserDB) {
            const newUser = await this.Model.create(data);
            await this.sessionToken(newUser, 200, res, next, redirectURL);
          } else {
            // If user exists, generate session token
            await this.sessionToken(isUserDB, 200, res, next, redirectURL);
          }
        }
      }
    );

  logout = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Clear access and refresh tokens by setting their maxAge to 1ms
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      const user = req.user as IUser;

      if (!user) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      // Get the user ID from the request object
      const userCacheId = this.redisKey(user?._id);

      // Check if user ID exists
      if (!userCacheId) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      // Delete user session from Redis
      await redis.del(userCacheId);

      // Send successful logout response
      res.status(200).json({
        status: true,
        message: "You have been successfully logged out.",
      });
    }
  );

  updateAccessToken = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Check if refresh token exists in cookies
      const refreshTokenCookie: string = req.cookies.refresh_token;
      if (!refreshTokenCookie) {
        const error: ApiError = new ApiError(
          "Please log in to access this resource.",
          400
        );
        next(error);
        return;
      }

      const refreshTokenSecret: string = this.getEnvVariable(
        "REFRESH_TOKEN",
        "Please log in to access this resource."
      );
      const accessTokenSecret: string = this.getEnvVariable(
        "ACCESS_TOKEN",
        "Please log in to access this resource."
      );

      // Verify the refresh token
      const decoded: JwtPayload | null = this.jwtVerifier(
        refreshTokenCookie,
        refreshTokenSecret
      ) as JwtPayload;

      if (!decoded || typeof decoded !== "object" || !decoded.id) {
        const error: ApiError = new ApiError(
          "Invalid or expired refresh token. Please log in again.",
          400
        );
        next(error);
        return;
      }
      // Extract session ID from the decoded token
      const sessionId = this.redisKey(decoded.id);
      if (!sessionId) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      // Retrieve user session from Redis
      const session: string | null = await redis.get(sessionId);

      if (!session) {
        const error = new ApiError(
          "Session data not found. Please log in again.",
          400
        );
        next(error);
        return;
      }

      // Parse user data from the session
      const user: IUser = JSON.parse(session);
      if (!user) {
        const error: ApiError = new ApiError(
          "User data not found. Please log in again.",
          400
        );
        next(error);
        return;
      }

      // Generate new access and refresh tokens
      const accessToken = this.jwtCreator(
        { id: user._id },
        accessTokenSecret ?? "",
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRE ?? "5m" }
      );

      const refreshToken = this.jwtCreator(
        { id: user._id },
        refreshTokenSecret ?? "",
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE ?? "3d" }
      );

      // Set user data in the request object
      req.user = user;

      // Set cookies for access and refresh tokens
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      // Store user session in Redis
      const userCacheId = this.redisKey(user?._id);
      await redis.set(userCacheId, JSON.stringify(user), "EX", 604800);

      // // Proceed to the next middleware
      next();

      // res.status(200).json({
      //   accessToken,
      //   refreshToken,
      // });
    }
  );

  getUserInfo = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      // Check if user ID exists
      if (!user?._id) {
        const error: ApiError = new ApiError(
          "Please sign in to your account and try again",
          400
        );
        next(error);
        return;
      }

      let sessionUser: any;

      // Generate Redis key for the user
      const userCacheId = this.redisKey(user?._id);

      // Check if user data exists in Redis cache
      const redisUser: string | null = await redis.get(userCacheId);

      // If user data exists in Redis cache, parse and use it
      if (redisUser) {
        sessionUser = JSON.parse(redisUser);
      } else {
        // If user data doesn't exist in Redis cache, fetch from MongoDB
        sessionUser = await this.Model.findById(user._id)
          .populate("courses")
          .exec();

        // If user doesn't exist in MongoDB, return an error
        if (!user) {
          const error: ApiError = new ApiError(
            "User not found. Please log in again.",
            400
          );
          next(error);
          return;
        }

        // Store user data in Redis cache with expiration set to 7 days
        await redis.set(
          userCacheId,
          JSON.stringify(sessionUser),
          "EX",
          7 * 24 * 60 * 60
        );
      }

      // Send the user information in the response
      res.status(200).json({
        status: true,
        sessionUser,
      });
    }
  );

  updateUserInfo = catchAsync(
    async (
      req: IUpdateUserBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Extract updated user data from the request body
      const { fname, lname, email } = req.body;

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

      // Check if user ID exists
      if (!user._id) {
        const error: ApiError = new ApiError(
          "User ID not found. Please log in and try again.",
          400
        );
        next(error);
        return;
      }

      // Find the user by ID
      const sessionUser = await this.Model.findById(user._id);

      // If user doesn't exist, return an error
      if (!sessionUser) {
        const error: ApiError = new ApiError(
          "User not found. Please log in and try again.",
          400
        );
        next(error);
        return;
      }

      // Update user data if provided
      if (fname && sessionUser) {
        sessionUser.fname = fname;
      }

      if (lname && sessionUser) {
        sessionUser.lname = lname;
      }

      if (email && sessionUser) {
        sessionUser.email = email;
      }

      // Save the updated user data
      await sessionUser?.save();

      // Store the updated user data in Redis cache
      const userCacheId = this.redisKey(user._id);
      await redis.set(userCacheId, JSON.stringify(user));

      // Send a successful response with the updated user data
      res.status(200).json({
        status: true,
        message: `${user.fname || fname}'s data updated successfully.`,
        sessionUser,
      });
    }
  );

  updateUserPassword = catchAsync(
    async (
      req: IUpdatePasswordBodyRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      // Extract old and new passwords from the request body
      const { oldPassword, newPassword } = req.body;

      const user = req.user as IUser;

      if (!user) {
        const error: ApiError = new ApiError(
          "Please login to access this resource",
          400
        );
        next(error);
        return;
      }

      // Check if both old and new passwords are provided
      if (!oldPassword || !newPassword) {
        const error: ApiError = new ApiError(
          "Both old and new passwords are required for the password update.",
          400
        );
        next(error);
        return;
      }

      // Find the user by ID and select the password field
      const sessionUser = await this.Model.findById(user._id).select(
        "+password +isVerified +isSocial"
      );

      // If user doesn't exist, return an error
      if (!sessionUser) {
        const error: ApiError = new ApiError(
          "Unable to find user. Please sign in to your account and try again.",
          400
        );
        next(error);
        return;
      }

      // Check if the user password field is valid
      if (sessionUser.password === undefined) {
        const error: ApiError = new ApiError("Invalid user.", 400);
        next(error);
        return;
      }

      // Check if the correctPassword method exists on the user object
      if (
        !sessionUser.correctPassword ||
        typeof sessionUser.correctPassword !== "function"
      ) {
        const errorMessage =
          process.env.NODE_ENV === "production"
            ? "Internal server error. Please try again later."
            : "Server error: user.correctPassword is not a function.";

        const error: ApiError = new ApiError(errorMessage, 500);
        next(error);
        return;
      }

      // Check if the old password matches the user's current password
      const isPasswordMatch: boolean = await sessionUser.correctPassword(
        oldPassword
      );
      if (!isPasswordMatch) {
        const error: ApiError = new ApiError(
          "Incorrect old password. Please try again.",
          400
        );
        next(error);
        return;
      }

      // Update the user password with the new password
      sessionUser.password = newPassword;

      // Save the updated user data
      await sessionUser?.save();

      // Store the updated user data in Redis cache
      const userCacheId = this.redisKey(user._id);

      await redis.set(userCacheId, JSON.stringify(user));

      // Send a successful response
      res.status(201).json({
        status: true,
        message: `${user.fname}, your password has been changed successfully.`,
      });
    }
  );

  updateUserRole = catchAsync(
    async (
      req: IUpdateUserRoleBodyRequest,
      res: Response,
      next: NextFunction
    ) => {
      // Extract role from the request body
      const { role } = req.body;
      const userId = req.params.id;

      // Validate user ID
      if (!this.isValid(userId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the user ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Check if role is provided
      if (!role) {
        const error: ApiError = new ApiError(
          "Oops! The role property must not be empty. Please provide a valid role.",
          404
        );
        next(error);
        return;
      }

      // Update user role in the database
      const sessionUser = await this.Model.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select("+isVerified +isSocial");

      // Check if user exists
      if (!sessionUser) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the user with the provided ID was not found.",
          404
        );
        next(error);
        return;
      }

      // Store updated user data in Redis cache
      const userCacheId = this.redisKey(sessionUser?._id);
      await redis.set(userCacheId, JSON.stringify(sessionUser));

      // Send response
      res.status(201).json({
        status: true,
        message: `${sessionUser.fname} is now ${sessionUser.role}!`,
      });
    }
  );

  getAllUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const sessionUser = await this.Model.find()
        .sort({ createAt: -1 })
        .select("+isVerified +isSocial");

      if (!sessionUser || sessionUser.length === 0) {
        const error: ApiError = new ApiError(
          "Oops! It seems like there are no users available at the moment. Please check back later or contact support for assistance.",
          404
        );
        next(error);
        return;
      }

      res.status(200).json({
        status: true,
        length: sessionUser.length,
        sessionUser,
      });
    }
  );

  deactivateAccount = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const userId: string = req.params.id;

      // Check if the provided user ID is valid
      if (!this.isValid(userId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the user ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Find the user by ID and update the 'active' property to false
      const sessionUser = await this.Model.findByIdAndUpdate(userId, {
        active: false,
      });

      // If user with the provided ID is not found, return an error
      if (!sessionUser) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the user with the provided ID was not found.",
          404
        );
        next(error);
        return;
      }

      // Store the updated user data in Redis cache
      const userCacheId = this.redisKey(sessionUser?._id);
      await redis.set(userCacheId, JSON.stringify(sessionUser));

      // Send a successful response indicating user deactivation
      res.status(204).json({
        status: "success",
        message: "User deactivated successfully.",
      });
    }
  );

  deleteUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const userId: string = req.params.id;

      // Check if the provided user ID is valid
      if (!this.isValid(userId)) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the user ID provided is invalid",
          400
        );
        next(error);
        return;
      }

      // Find the user by ID
      const sessionUser = await this.Model.findById(userId);

      // If user with the provided ID is not found, return an error
      if (!sessionUser) {
        const error: ApiError = new ApiError(
          "Oops! It seems like the user with the provided ID was not found.",
          404
        );
        next(error);
        return;
      }

      // Delete the user from the database
      await sessionUser?.deleteOne({ userId });

      // Remove the user data from Redis cache
      const userCacheId = this.redisKey(sessionUser?._id);
      await redis.del(userCacheId);

      // Send a successful response indicating user deletion
      res.status(204).json({
        status: true,
        message: "User deleted successfully.",
      });
    }
  );
}

export default Authenticator;
