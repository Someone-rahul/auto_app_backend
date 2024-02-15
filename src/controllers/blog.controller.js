import { Blog } from "../models/blog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../utils/fileUpload.js";

const addBlog = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  if (title.trim() === "" && content.trim() === "") {
    throw new ApiError(404, "All fields are required");
  }
  let blogImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.blogImage) &&
    req.files.blogImage.length > 0
  ) {
    blogImageLocalPath = req.files.blogImage[0].path;
  }
  let blogVideoLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.blogVideo) &&
    req.files.blogVideo.length > 0
  ) {
    blogVideoLocalPath = req.files.blogVideo[0].path;
  }
  let blogImage;
  if (blogImageLocalPath) {
    blogImage = await upload(blogImageLocalPath);
  }
  let blogVideo;
  if (blogVideoLocalPath) {
    blogVideo = await upload(blogVideoLocalPath);
  }
  const blog = await Blog.create({
    title,
    content,
    image: blogImage?.url || "",
    video: blogVideo?.url || "",
  });

  if (!blog) {
    throw new ApiError(500, "Internal server error could not create new blog");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, blog, "Blog is added successfully"));
});
export { addBlog };
