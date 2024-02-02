import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerDriver,
  registerPassenger,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

//this upload.fields is a middleware which works as a middle man
//driver register endpoint
router.route("/register/driver").post(
  upload.fields([
    {
      name: "userImage",
      maxCount: 1,
    },
    {
      name: "vehicleImage",
      maxCount: 1,
    },
    {
      name: "liscenceImage",
      max: 1,
    },
    {
      name: "billBookImage",
      max: 1,
    },
  ]),
  registerDriver
);
// passenger register endpoint
router.route("/register/passenger").post(
  upload.fields([
    {
      name: "userImage",
      maxCount: 1,
    },
  ]),
  registerPassenger
);

router.route("/login").post(loginUser);

//secured route
router.route("/logout").post(verifyJwt, logoutUser);
export default router;
