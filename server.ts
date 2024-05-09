import { app } from "./app";
import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { connectDB } from "./src/config/db";
import CloudinaryService from "./src/config/cloudinary";

// Load environment variables
dotenv.config({ path: "./.env" });

// Define types for environment variables
interface ProcessEnv {
  PORT?: string;
  NODE_ENV?: "development" | "production" | "test";
  DATABASE_LOCAL?: string;
  CLOUD_NAME?: string;
  CLOUD_API_KEY?: string;
  CLOUD_API_SECRET?: string;
}

const {
  PORT,
  NODE_ENV,
  DATABASE_LOCAL,
  CLOUD_NAME,
  CLOUD_API_KEY,
  CLOUD_API_SECRET,
}: ProcessEnv = process.env as ProcessEnv;
if (!PORT) {
  console.error("PORT is not defined in the environment variables.");
  process.exit(1);
}
if (!NODE_ENV) {
  console.error("NODE_ENV is not defined in the environment variables.");
  process.exit(1);
}
if (!DATABASE_LOCAL) {
  console.error("DATABASE_LOCAL is not defined in the environment variables.");
  process.exit(1);
}
if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
  console.error(
    "Cloudinary configuration is not defined in the environment variables."
  );
  process.exit(1);
}

// Create an HTTP server instance using Express app
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server);

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send a message after 1 second of connection
  setTimeout(() => {
    socket.emit("message", "I am ok");
  }, 1000);

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Connect to MongoDB and start the server
connectDB(DATABASE_LOCAL)
  .then(() => {
    // Start the server
    server.listen(parseInt(PORT), () => {
      console.log(`App is running on port ${PORT} and ${NODE_ENV} mode`);
    });

    // Establish connection to Cloudinary
    CloudinaryService.getInstance({
      cloud_name: CLOUD_NAME,
      api_key: CLOUD_API_KEY,
      api_secret: CLOUD_API_SECRET,
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err: Error) => {
      console.error("Unhandled Promise Rejection:", err);
      server.close(() => {
        process.exit(1);
      });
    });
  })
  .catch((error: mongoose.Error) => {
    console.error("Database connection error:", error.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});
