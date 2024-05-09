import crypto from "crypto";
import jwt from "jsonwebtoken";

export interface OtpGeneratorOptions {
  expiresIn?: string | number;
  otpLength?: number;
}

export interface OtpGeneratorResult {
  token: string;
  otp: number;
}

export const otpGenerator = (
  payload: any,
  secret: string,
  options: OtpGeneratorOptions = {}
): OtpGeneratorResult => {
  const { expiresIn = "10m", otpLength = 6 } = options;

  if (otpLength < 6 || otpLength > 10) {
    throw new Error("OTP length must be between 6 and 10 digits.");
  }

  const otpMin = Math.pow(10, otpLength - 1);
  const otpMax = Math.pow(10, otpLength);

  const otp = crypto.randomInt(otpMin, otpMax);

  try {
    const token = jwt.sign({ payload, otp }, secret, {
      expiresIn,
    });

    return { token, otp };
  } catch (error) {
    throw new Error("Failed to generate OTP. Please try again.");
  }
};
