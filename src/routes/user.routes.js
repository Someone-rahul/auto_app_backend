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
import {
  getAll,
  getById,
  verifyDriver,
} from "../controllers/driver.controller.js";
import { getAllPassenger } from "../controllers/passenger.controller.js";
import { handleError } from "../middlewares/errorHandling.middleware.js";

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
  registerDriver,
  handleError
);
// passenger register endpoint
router
  .route("/register/passenger")
  .post(uploadLocally.single("userImage"), registerPassenger, handleError);

router.route("/login").post(loginUser, handleError);
router.route("/checkPhone/:phoneNumber").get(findByPhoneNumber, handleError);
//secured route
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/driver/get").get(getAll);
router.route("/passenger/get").get(getAllPassenger);
router.route("/driver/:id").get(getById);
router.route("/verifyDriver/:id").get(verifyDriver);
export default router;
