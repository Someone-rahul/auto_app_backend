import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { upload } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Driver } from "../models/driver.model.js";

//for generating access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    //saving the refresh token to database
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

//driver register endpoint (http://localhost:8000/api/v1/users/register/driver)
const registerDriver = asyncHandler(async (req, res) => {
  //getting user details from frontend
  const {
    firstName,
    lastName,
    address,
    phoneNumber,
    userRole,
    liscenceNumber,
    password,
    numberPlate,
    color,
  } = req.body;

  //validation check
  if (
    [
      firstName,
      lastName,
      address,
      phoneNumber,
      userRole,
      liscenceNumber,
      numberPlate,
      password,
    ].some((item) => item?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exist or not
  //this $or is a mongodb's operator
  const existedUser = await User.findOne({ phoneNumber });
  if (existedUser) {
    throw new ApiError(409, `user already exist with these credential`);
  }
  const userImageLocalpath = req.files?.userImage[0]?.path;
  // console.log("userImage: " + userImageLocalpath);
  const vehicleImageLocalpath = req.files?.vehicleImage[0]?.path;
  const liscenceImageLocalpath = req.files?.liscenceImage[0]?.path;
  const billBookImageLocalpath = req.files?.billBookImage[0]?.path;
  if (
    !userImageLocalpath &&
    !vehicleImageLocalpath &&
    !liscenceImageLocalpath &&
    !billBookImageLocalpath
  ) {
    throw new ApiError(400, "All Images are required");
  }

  //image uploading in cloudinary
  const userImage = await upload(userImageLocalpath);
  const vehicleImage = await upload(vehicleImageLocalpath);
  const liscenceImage = await upload(liscenceImageLocalpath);
  const billBookImage = await upload(billBookImageLocalpath);

  //checking that avatar is successfully uploaded or not if not throw a message
  if (!userImage && !vehicleImage && !liscenceImage && !billBookImage) {
    throw new ApiError(400, "All Images are required");
  }

  const user = await User.create({
    firstName,
    lastName,
    address,
    phoneNumber,
    userRole,
    userImage: userImage.url,
    password,
  });
  const vehicle = await Vehicle.create({
    vehicleImage: vehicleImage.url,
    color,
    billBookImage: billBookImage.url,
    numberPlate,
  });
  const driver = await Driver.create({
    userId: user._id,
    vehicleId: vehicle._id,
    liscenceImage: liscenceImage.url,
    liscenceNumber,
  });

  //check if user is successfully created or not
  //and filter the created user by not adding password and refresh token
  //that we dont want to send the response with password or refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const createdDriver = await Driver.findById(driver._id);
  const createdVehicle = await Vehicle.findById(vehicle._id);

  //   checking if user is created successfully or not
  if (!createdUser && !createdDriver && !createdVehicle) {
    throw new ApiError(
      500,
      "Something went wrong while registering new driver"
    );
  }
  const combinedUser = {
    createdUser,
    createdDriver,
    createdVehicle,
  };
  //sending the resoponse
  return res
    .status(201)
    .json(new ApiResponse(200, combinedUser, "User registered successfully"));
});

//passenger register endpoint (http://localhost:8000/api/v1/users/register/passenger)
const registerPassenger = asyncHandler(async (req, res) => {
  //getting user details from frontend
  const { firstName, lastName, address, phoneNumber, userRole, password } =
    req.body;

  //validation check
  if (
    [firstName, lastName, address, phoneNumber, userRole, password].some(
      (item) => item?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exist or not
  const existedUser = await User.findOne({ phoneNumber });
  if (existedUser) {
    throw new ApiError(409, `user already exist with these credential`);
  }
  // console.log("existed user: ", existedUser);
  // console.log(req.file.path);
  // console.log("user controller: ", req.files?.userImage[0]?.path);
  const userImageLocalpath = req.file?.path;
  if (!userImageLocalpath) {
    throw new ApiError(400, "User image is required");
  }

  //image uploading in cloudinary
  const userImage = await upload(userImageLocalpath);

  //checking that avatar is successfully uploaded or not if not throw a message
  if (!userImage) {
    throw new ApiError(400, "Image is not uploaded successfully");
  }

  //creating user and add entry in db
  const user = await User.create({
    firstName,
    lastName,
    address,
    phoneNumber,
    userRole,
    userImage: userImage.url,
    password,
  });

  //check if user is successfully created or not
  //and filter the created user by not adding password and refresh token
  //that we dont want to send the response with password or refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //   checking if user is created successfully or not
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering new user");
  }
  //sending the resoponse
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//login user
const loginUser = asyncHandler(async (req, res) => {
  //getting data from client
  const { phoneNumber, password } = req.body;
  //empty validation
  if (!phoneNumber && !password) {
    throw new ApiError("phone number or password is required");
  }
  // console.log("login credentieals: ", phoneNumber, password);

  //check if the phone number exist or not
  const user = await User.findOne({ phoneNumber });
  if (!user) {
    throw new ApiError(
      400,
      `User with ${phoneNumber} does not exist, please register first`
    );
  }
  // console.log("user :", user);
  //check password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }
  // console.log("is password valid: ", isPasswordValid);
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // console.log("logged in user :", loggedInUser);

  //sending access token in cookie
  //after adding this option true then cookie can not be modified by the client side
  // so we must need to set these options true while sending cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        { user: loggedInUser, accessToken, refreshToken },
        "user is logged in successfully"
      )
    );
});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
  // console.log(req.user._id);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out successfully"));
});
const findByPhoneNumber = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    throw new ApiError(404, "Phone number not found");
  }
  const user = await User.findOne({ phoneNumber }).select("phoneNumber");
  console.log(user);
  if (user) {
    throw new ApiError(400, "User already exist exist");
  }
  return res.status(200).json(new ApiResponse(200, user, "User is not exist"));
});
export {
  registerDriver,
  registerPassenger,
  loginUser,
  logoutUser,
  findByPhoneNumber,
};
