/* eslint-disable @typescript-eslint/no-unsafe-argument */
import express, { Application, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import session from "express-session";
import cors from "cors";
import path from "path";

import ApiError from "./src/middlewares/errors/apiError";
import errorMiddleware from "./src/middlewares/errors/errorHandler";
import authRouter from "./src/routes/authRoutes";
import couresRouter from "./src/routes/courseRoutes";
import orderRouter from "./src/routes/orderRoutes";
import reviewRouter from "./src/routes/reviewRoutes";
import exportedRouter from "./src/routes/exportedRoutes";
import categoryRouter from "./src/routes/categoryRoutes";

import { initializePassport, passport } from "./passport";
import authController from "./src/controllers/authController";

// Create an Express application
export const app: Application = express();

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serving static files
app.use(express.static(path.join(__dirname, "./src/views")));

// Parse request bodies
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Parse cookies
app.use(cookieParser());

// Configure Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8000",
    ],
    credentials: true,
  })
);

// Testing api
app.get("/testing", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: true,
    message: "Api working well!",
  });
});

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Serialize user into the session
passport.serializeUser((user: any, done: any) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user: any, done: any) => {
  done(null, user);
});

// Initialize Passport
initializePassport();
app.use(passport.session());
app.use(passport.initialize());

app.get(
  "/api/v1/user/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/api/v1/user/auth/github",
  passport.authenticate("github", { scope: ["profile", "email"] })
);

app.get(
  "/api/v1/user/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/signin`,
  }),
  authController.oauth("google")
);

app.get(
  "/api/v1/user/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}/signin`,
  }),
  authController.oauth("github")
);

// Global route
app.use("/api/v1/user", authRouter);
app.use("/api/v1/course", couresRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/exported", exportedRouter);
app.use("/api/v1/category", categoryRouter);

// Global Error
app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorMiddleware);
