import express from "express";
import {
  getAllUsers,
  getAUser,
  loginUser,
  myProfile,
  registerUser,
  updateProfile,
} from "../controllers/userController.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", isAuth, myProfile);
router.get("/user/all", isAuth, getAllUsers);
router.get("/user/:id", isAuth, getAUser);
router.post("/update/user", isAuth, updateProfile);

export default router;
