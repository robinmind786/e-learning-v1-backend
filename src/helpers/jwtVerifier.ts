import jwt, { JwtPayload } from "jsonwebtoken";

// Define a custom error class for JWT verification errors
class JWTVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWTVerificationError";
  }
}

export const jwtVerifier = async (
  token: string,
  secret: string
): Promise<JwtPayload> => {
  if (!token || !secret) {
    throw new JWTVerificationError(
      "Token and secret are required for verification"
    );
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Check if token has expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      throw new JWTVerificationError("Token has expired");
    }

    // Additional checks if needed, such as verifying token issuer against a database

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new JWTVerificationError("Token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new JWTVerificationError("Invalid JWT token");
    } else {
      throw new JWTVerificationError("Failed to verify JWT token");
    }
  }
};
