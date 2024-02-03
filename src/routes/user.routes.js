import { Router } from "express";
import {
  findByPhoneNumber,
  loginUser,
  logoutUser,
  registerDriver,
  registerPassenger,
} from "../controllers/user.controller.js";
import { uploadLocally } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getAll } from "../controllers/driver.controller.js";
import { getAllPassenger } from "../controllers/passenger.controller.js";

const router = Router();

//this upload.fields is a middleware which works as a middle man
//driver register endpoint
router.route("/register/driver").post(
  uploadLocally.fields([
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
router
  .route("/register/passenger")
  .post(uploadLocally.single("userImage"), registerPassenger);

router.route("/login").post(loginUser);
router.route("/checkPhone").get(findByPhoneNumber);
//secured route
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/driver/get").get(getAll);
router.route("/passenger/get").get(getAllPassenger);
export default router;
