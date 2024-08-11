import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.Model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

//p2:step-5: generate access and refresh token for login purposes
const generateAccessAndRefreshTokens = async(userId) =>
{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()    // Access token is given to user via methods
        const refreshToken = user.generateRefreshToken()  // Refresh Token is stored in database

        user.refreshToken = refreshToken //adding value in object
        await user.save({validateBeforeSave: false})  //saving the object - no need for validation, save directly

        return {accessToken, refreshToken}

    } catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
};

const registerUser = asyncHandler( async (req, res) => {
    //p1: steps----------------
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

const loginUser = asyncHandler(async (req,res) =>{
    //p2:steps------------------------------------------------
    //s-1: req body -> data (take data from request body)
    //s-2: username or email
    //s-3: find the user
    //s-4: password check
    //s-5: generate access and refresh token, send it to user
    //s-6: send cookie
//------------------------------------------------------------------------------------------------
    //step-1: data from request body
    const {email, username, password} = req.body
    console.log(email);


    //step-2: username/email requirement
    if(!(username || email )){
        throw new ApiError(400, "username or email is required")
    }
    //here is the alternative of the above code based on the logic difference
    //    if(!username && !email){
    //    throw ApiError(400,"Username or email is required")
    //    }


    //step-3: find the user
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    //step-4:password check
    await user.isPasswordCorrect(password)    //user-database instance by us, User-mongo instance, password-from request body
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    //step-5: send to the user
    const{accessToken, refreshToken} = await
    generateAccessAndRefreshTokens(user._id)

    //step-6: cookies
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    //sending cookies
    const options = {
        httpOnly: true, // by default cookies can be modified by anyone in frontend,true attribute changes it to modifiable by server only
        secure: true,  //can be modified only on server
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)      //access token set
    .cookie("refreshToken",refreshToken,options)    //refresh token set
    .json(//json response from server
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken //we r sending accessToken and refreshToken separately again to consider the case-> user wants to save access and refresh token by himself for any reason
            },
            "User logged in successfully"
        )
    )
} )

//logout -> clear 1.cookies, 2.accessToken and refreshToken
const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined,
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User logged Out"))

})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    //1.incomingRefreshToken is different from refreshToken and named so because refreshToken is already in the database
    //and to hit the endpoint of API for matching we access refreshToken from the cookies in the form of incoming..,
    //2.req.cookies=>access it from cookies ;req.body=>if using mobile application
    if(incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        //sending a query to mongoDB to get user information
        const user = await User.findById(decodedToken?._id) //await as it is a database query
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken} = await
        generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken:  newRefreshToken},
                "Access token refreshed")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};