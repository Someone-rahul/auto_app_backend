import { Driver } from "../models/driver.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAll = asyncHandler(async (req, res) => {
  const drivers = await Driver.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "usersDetail",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              address: 1,
              status: 1,
              phoneNumber: 1,
              userImage: 1,
              totalRide: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "vehicleId",
        foreignField: "_id",
        as: "vehicleDetails",
        pipeline: [
          {
            $project: {
              numberPlate: 1,
              color: 1,
              vehicleImage: 1,
              billBookImage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $first: "$usersDetail",
        },
        vehicle: {
          $first: "$vehicleDetails",
        },
      },
    },
    {
      $project: {
        user: 1,
        liscenceImage: 1,
        liscenceNumber: 1,
        vehicle: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, drivers, "Driver data is fetched successfully"));
});
export { getAll };
