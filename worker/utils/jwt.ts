import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRATION_TTL =
  (process.env.JWT_ACCESS_EXPIRATION_TTL || "1d") as SignOptions["expiresIn"];

// Check JWT defined
if (!JWT_SECRET || !JWT_ACCESS_EXPIRATION_TTL) {
  throw new Error("JWT_SECRET and JWT_ACCESS_EXPIRATION_TTL must be defined");
}

export interface JwtPayload {
  userId: string;
  role: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRATION_TTL,
  };
  return jwt.sign(payload, JWT_SECRET as string, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
};
