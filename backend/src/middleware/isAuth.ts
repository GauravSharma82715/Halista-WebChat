import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Please login - authorization token missing",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "default_jwt_secret";

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded || !decoded.user) {
      res.status(401).json({
        message: "Invalid or expired token",
      });
      return;
    }

    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please login - invalid session",
    });
  }
};

export default isAuth;
