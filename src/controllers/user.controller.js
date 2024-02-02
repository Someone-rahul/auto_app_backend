import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { upload } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Driver } from "../models/driver.model.js";

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

  //checking for image(avatar)
  // console.log(req.files);
  const userImageLocalpath = req.files?.userImage[0]?.path;
  const vehicleImageLocalpath = req.files?.vehicleImage[0]?.path;
  const liscenceImageLocalpath = req.files?.liscenceImage[0]?.path;
  const billBookImageLocalpath = req.files?.billBookImage[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0].path;
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
  const driver = await Driver.create({
    liscenceImage: liscenceImage.url,
    liscenceNumber,
  });
  const vehicle = await Vehicle.create({
    vehicleImage: vehicleImage.url,
    color,
    billBookImage: billBookImage.url,
    numberPlate,
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
  //this $or is a mongodb's operator
  const existedUser = await User.findOne({ phoneNumber });
  if (existedUser) {
    throw new ApiError(409, `user already exist with these credential`);
  }

  //checking for image(avatar)
  // console.log(req.files);
  const userImageLocalpath = req.files?.userImage[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0].path;
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

const loginUser = asyncHandler(async (req, res) => {
  //---steps
  //get the email,username,password
  // empty validation
  //check if email exist or not
  // then check the password
  //generate both accesstoken and refresh token
  //send secured cookie

  //getting data from client
  const { email, password, username } = req.body;
  console.log("a:", email, password, username);
  //empty validation
  if ((!email || !username) && !password) {
    throw new ApiError("Username or email or password is required");
  }

  // check if email does not exist
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(
      400,
      `User with ${email || username} does not exist, please register first`
    );
  }
  //check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = User.findById(user._id).select(
    "-password -refreshToken"
  );

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
        { user: user, accessToken, refreshToken },
        "user is logged in successfully"
      )
    );
});

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
export { registerDriver, registerPassenger, loginUser, logoutUser };
