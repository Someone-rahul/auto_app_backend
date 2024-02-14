// import mongoose, { Schema } from "mongoose";
import { Driver } from "../models/driver.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ObjectId } from "mongodb";

const getAll = asyncHandler(async (req, res) => {
  // Default page is 1, default limit is 10
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const list = await Driver.aggregate([
    { $skip: skip },
    { $limit: parseInt(limit) },
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
              createdAt: 1,
              updatedAt: 1,
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
        accountVerifyStatus: 1,
        availabilityStatus: 1,
        vehicle: 1,
        ratings: 1,
      },
    },
  ]);
  const totalDrivers = await Driver.countDocuments();

  const totalPages = Math.ceil(totalDrivers / limit);
  const pagination = {
    totalItem: totalDrivers,
    currentPageNumber: parseInt(page),
    totalPage: totalPages,
    nextPageNumber: page < totalPages ? parseInt(page) + 1 : null,
    previousPageNumber: page > 1 ? parseInt(page) - 1 : null,
  };
  const data = {
    list,
    pagination,
  };
  if (list) {
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Driver data is fetched successfully"));
  } else {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Error while fetching driver info" });
  }
});
const getById = asyncHandler(async (req, res) => {
  // console.log(req.params);
  const data = req.params;
  console.log("data", data.id);
  if (!data.id) {
    throw new ApiError(404, "id is not found");
  }
  console.log("object id: ", new ObjectId(data.id));
  const drivers = await Driver.aggregate([
    {
      $match: {
        _id: new ObjectId(data.id),
      },
    },
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
              createdAt: 1,
              updatedAt: 1,
              userRole: 1,
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
        accountVerifyStatus: 1,
        availabilityStatus: 1,
        vehicle: 1,
        ratings: 1,
      },
    },
  ]);
  if (drivers.length === 0) {
    throw new ApiError(404, "Driver not found");
  } else {
    return res
      .status(200)
      .json(
        new ApiResponse(200, drivers[0], "Driver data is fetched successfully")
      );
  }
});
const verifyDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(404, "Id not found");
  }
  const updatedDriver = await Driver.findByIdAndUpdate(
    id,
    {
      $set: {
        accountVerifyStatus: true,
      },
    },
    {
      new: true,
    }
  ).select("accountVerifyStatus");
  console.log("updated driver data:", updatedDriver);
  if (!updatedDriver) {
    throw new ApiError(500, "Could not verified driver");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedDriver, "Account verified successfully"));
});
export { getAll, getById, verifyDriver };
