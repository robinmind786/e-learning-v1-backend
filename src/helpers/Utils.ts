import jwt, {
  JsonWebTokenError,
  Jwt,
  JwtPayload,
  Secret,
  SignOptions,
  TokenExpiredError,
  VerifyOptions,
} from "jsonwebtoken";
import { ObjectId, ObjectIdLike } from "bson";
import crypto from "crypto";
import { IOtpGenerator } from "./UtilsType";
import { sheets } from "../config/sheet";
import cloudinary, {
  DeliveryType,
  ResourceType,
  UploadApiResponse,
  ResponseCallback,
} from "cloudinary";
import { NextFunction, Request, Response } from "express";
import ApiError from "../middlewares/errors/apiError";

class Utils {
  protected jwtErrorMsg: string = this.devMode()
    ? "🚫 Invalid token or secret provided. Token must be a string; secret must be a string."
    : "Oops! Something went wrong. Please try again later. 😥";

  protected devMode(): boolean {
    return process.env.NODE_ENV === "development";
  }

  capitalize(text: string): string {
    if (text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    } else {
      return "";
    }
  }

  jwtCreator(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret,
    options?: SignOptions
  ): string {
    try {
      if (
        (typeof payload !== "string" &&
          !Buffer.isBuffer(payload) &&
          typeof payload !== "object") ||
        typeof secretOrPrivateKey !== "string"
      ) {
        throw new Error(this.jwtErrorMsg);
      }

      const token = jwt.sign(payload, secretOrPrivateKey, options);
      return token;
    } catch (error: any) {
      console.error("Failed to create JWT:", error.message);
      throw new Error(this.jwtErrorMsg);
    }
  }

  jwtVerifier(
    token: string,
    secretOrPublicKey: Secret,
    options?: VerifyOptions
  ): Jwt | JwtPayload | string | any {
    try {
      if (typeof token !== "string" || typeof secretOrPublicKey !== "string") {
        throw new Error(this.jwtErrorMsg);
      }

      const decoded = jwt.verify(token, secretOrPublicKey, options);

      return decoded;
    } catch (error: any) {
      console.error("Failed to verify JWT:", error.message);
      if (error instanceof TokenExpiredError) {
        throw new Error("Token has expired");
      } else if (error instanceof JsonWebTokenError) {
        throw new Error("Invalid JWT token");
      } else {
        throw new Error(this.jwtErrorMsg);
      }
    }
  }

  redisKey(key: string | Buffer | number | undefined | ObjectId | any): string {
    try {
      const validId: string = key?.toString() ?? "";

      return validId;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  isValid(id: string | number | ObjectId | ObjectIdLike | Uint8Array): boolean {
    if (!id) {
      throw new Error(
        "⚠️ Please provide a valid MongoDB ObjectId or its equivalent type."
      );
    }

    return ObjectId.isValid(id);
  }

  otpGenerator(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret
  ): IOtpGenerator {
    const otpMin = Math.pow(10, 6 - 1);
    const otpMax = Math.pow(10, 6);

    const otp: number = crypto.randomInt(otpMin, otpMax);

    try {
      if (
        (typeof payload !== "string" &&
          !Buffer.isBuffer(payload) &&
          typeof payload !== "object") ||
        typeof secretOrPrivateKey !== "string"
      ) {
        throw new Error(this.jwtErrorMsg);
      }

      const token = this.jwtCreator({ payload, otp }, secretOrPrivateKey, {
        expiresIn: "10m",
      });

      return { token, otp };
    } catch (error: any) {
      console.error("Failed to create JWT:", error.message);
      throw new Error(this.jwtErrorMsg);
    }
  }

  getEnvVariable(key: string, errorMessage: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(errorMessage);
    }
    return value;
  }

  ensureEnvVariables(
    keys: string[]
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      for (const key of keys) {
        if (!process.env[key]) {
          let errorMessage = "Internal server error. Please try again later.";
          if (this.devMode()) {
            errorMessage = `${key} is not defined. Please check your environment configuration.`;
          }
          const error: ApiError = new ApiError(errorMessage, 500);
          next(error);
          return;
        }
      }
      next();
    };
  }

  async googleSheet(
    responseType: "GET" | "POST",
    range: string,
    valueInputOption?: string,
    values?: any[][]
  ): Promise<any[][] | null | undefined> {
    try {
      if (responseType === "GET") {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SPREADSHEET_ID,
          range,
        });
        return response.data.values;
      } else if (responseType === "POST") {
        if (!values) {
          throw new Error("Values are required for POST request");
        }

        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SPREADSHEET_ID,
          range,
          valueInputOption,
          requestBody: {
            values,
          },
        });
        return null;
      } else {
        throw new Error("Invalid responseType provided");
      }
    } catch (error) {
      console.error(
        `Error ${
          responseType === "GET" ? "retrieving" : "updating"
        } data from the sheet:`,
        error
      );
      throw error;
    }
  }

  async imgHandling(
    responseType: "POST" | "DELETE",
    data: {
      thumbnail: string;
    },
    folder: string,
    publicId: string,
    options?: {
      resource_type?: ResourceType;
      type?: DeliveryType;
      invalidate?: boolean;
    },
    callback?: ResponseCallback
  ): Promise<void> {
    try {
      if (responseType === "POST") {
        if (data.thumbnail) {
          const myCloud: UploadApiResponse =
            await cloudinary.v2.uploader.upload(data.thumbnail, {
              folder,
            });

          data.thumbnail = myCloud.publicId;
        }
      } else if (responseType === "DELETE") {
        await cloudinary.v2.uploader.destroy(publicId, options);
      }
    } catch (error) {
      console.error("Error handling images:", error);
      throw error;
    }
  }
}

export default Utils;
