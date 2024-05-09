import jwt, { SignOptions } from "jsonwebtoken";

class JWTCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWTCreationError";
  }
}

interface Payload extends Record<string, any> {}

export const jwtCreator = (
  payload: Payload,
  secret: string,
  expiresIn?: string,
  options?: SignOptions
): string => {
  if (!secret || !payload || typeof payload !== "object") {
    throw new JWTCreationError("Invalid payload or secret provided");
  }

  if (expiresIn && options) {
    options.expiresIn = expiresIn;
  } else if (expiresIn) {
    options = { expiresIn };
  }

  try {
    const token = jwt.sign(payload, secret, options);
    return token;
  } catch (error: any) {
    console.error("Failed to create JWT:", error.message);
    throw new JWTCreationError("Failed to create JWT");
  }
};
