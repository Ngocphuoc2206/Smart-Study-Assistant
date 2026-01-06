import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

function parseExpiresIn(
  v: string | undefined,
  fallback: SignOptions["expiresIn"]
) {
  if (!v) return fallback;
  const s = v.trim();
  if (/^\d+$/.test(s)) return Number(s);
  return s as SignOptions["expiresIn"];
}

const JWT_ACCESS_EXPIRATION_TTL = parseExpiresIn(
  process.env.JWT_ACCESS_EXPIRATION_TTL,
  "15m"
);

const JWT_REFRESH_EXPIRATION_TTL = parseExpiresIn(
  process.env.JWT_REFRESH_EXPIRATION_TTL,
  "14d"
);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined");
}

export interface JwtPayload {
  userId: string;
  role: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: JWT_ACCESS_EXPIRATION_TTL,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: JWT_REFRESH_EXPIRATION_TTL,
  });
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
};
