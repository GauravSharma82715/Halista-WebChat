import bcrypt from "bcryptjs";
import { generateToken } from "../config/generateToken.js";
import TryCatch from "../config/TryCatch.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import { User } from "../models/User.js";

// Register new user with Email and Password
export const registerUser = TryCatch(async (req, res) => {
  const { name, email, password } = req.body;

  const cleanName = name ? name.trim() : "";
  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const cleanPassword = password ? password.trim() : "";

  if (!cleanName || !cleanEmail || !cleanPassword) {
    res.status(400).json({
      message: "Name, email, and password are required",
    });
    return;
  }

  if (cleanPassword.length < 6) {
    res.status(400).json({
      message: "Password must be at least 6 characters long",
    });
    return;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    res.status(400).json({
      message: "An account with this email already exists. Please login.",
    });
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(cleanPassword, salt);

  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
    password: hashedPassword,
  });

  const token = generateToken(user);

  res.status(201).json({
    message: "Registration successful! Welcome to HalistaChat.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || "",
    },
    token,
  });
});

// Login with Email and Password
export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const cleanPassword = password ? password.trim() : "";

  if (!cleanEmail || !cleanPassword) {
    res.status(400).json({
      message: "Email and password are required",
    });
    return;
  }

  // Find user
  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    res.status(400).json({
      message: "User does not exist",
    });
    return;
  }

  // Verify password
  const isMatch = await bcrypt.compare(cleanPassword, user.password || "");
  if (!isMatch) {
    res.status(400).json({
      message: "Invalid password",
    });
    return;
  }

  const token = generateToken(user);

  res.status(200).json({
    message: "Login successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || "",
    },
    token,
  });
});

// Get current logged-in user profile
export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?._id).select("-password");
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
});

// Update profile (name, avatar)
export const updateProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    res.status(404).json({
      message: "User not found. Please login again.",
    });
    return;
  }

  if (req.body.name !== undefined && req.body.name.trim() !== "") {
    user.name = req.body.name.trim();
  }

  if (req.body.profilePic !== undefined) {
    user.profilePic = req.body.profilePic;
  }

  await user.save();

  const token = generateToken(user);

  res.json({
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || "",
    },
    token,
  });
});

// Get all users (except current logged-in user)
export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user?._id;
  const users = await User.find({ _id: { $ne: currentUserId } })
    .select("-password")
    .sort({ name: 1 });

  res.json(users);
});

// Get a single user by ID
export const getAUser = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
});
