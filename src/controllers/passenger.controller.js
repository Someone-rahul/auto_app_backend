import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllPassenger = asyncHandler(async (req, res) => {
  // Default page is 1, default limit is 10
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const allPassenger = await User.aggregate([
    { $skip: skip },
    { $limit: parseInt(limit) },
    {
      $match: {
        userRole: "passenger",
      },
    },
  ]);
  const totalPassengers = await User.countDocuments({ userRole: "passenger" });
  const totalPages = Math.ceil(totalPassengers / limit);
  if (!allPassenger) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error while fetching driver info" });
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      allPassenger,
      {
        totalItem: totalPassengers,
        currentPageNumber: parseInt(page),
        totalPage: totalPages,
        nextPageNumber: page < totalPages ? parseInt(page) + 1 : null,
        previousPageNumber: page > 1 ? parseInt(page) - 1 : null,
      },
      "All passenger fetched successfully"
    )
  );
});
export { getAllPassenger };
