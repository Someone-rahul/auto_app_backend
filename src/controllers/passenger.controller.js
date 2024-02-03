import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllPassenger = asyncHandler(async (req, res) => {
  const allPassenger = await User.aggregate([
    {
      $match: {
        userRole: "passenger",
      },
    },
  ]);
  if (!allPassenger) {
    throw new ApiError(404, "Not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, allPassenger, "All passenger fetched successfully")
    );
});
export { getAllPassenger };
