import jwt from "jsonwebtoken";
import { IUser } from "../models/User.js";

export const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || "default_jwt_secret";
  return jwt.sign(
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || "",
      },
    },
    secret,
    {
      expiresIn: "15d",
    }
  );
};
