import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.Model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //1. get user details from frontend
    //2. validation - not empty string
    //3. check if user already exists: username , email
    //4. check for images, check for avatar
    //5. upload them to cloudinary, avatar
    //6. create user object - create entry in db
    //7. remove password and refresh token field from response
    //8. check for user creation
    //9. return response
//----------------------------------------------------------------
    //step-1: get details
    const {fullName, email, username, password}=req.body
    console.log("email:", email);

    //step-2: validations
    if ([fullName, email, username, password].some((field)=>
    field?.trim() === "")
    ) {
        throw new ApiError(400,"All fields are required")
    }

    //step-3:check for new user
    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })
    if(existedUser){
        throw new ApiError (409,"User with email or username already exists")
    }
    // console.log(req.files);

    //multer gives access to request.files by default
    const avatarLocalPath = req.files?.avatar[0]?.path; //local path as path is of server not of cloudinary
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //classic if-else checking
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
    coverImageLocalPath = req.files.coverImage[0].path
    }

    //step-4:check for avatar
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //step-5: uploading on cloudinary server
    const avatar = await uploadOnCloudinary(avatarLocalPath)   //this process will take time so will use await
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    //step-6: creating entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })
    //step-7:remove password and refreshToken, checking user is null/empty or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )   //findById is method where id cane be passed, _id: field made automatically by mongodb,password and refreshToken fields wont be there(-ve)

    //step-8: check for user creation,throwing error from sever side, if any
    if (!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    //step-9:return response
    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered Successfully")
    )
});


export {
    registerUser
};