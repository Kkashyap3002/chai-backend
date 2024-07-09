import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

    // Configuration of Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ,
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
    });

    const uploadOnCloudinary = async (localFilePath) => {
        try{
            if (!localFilePath) return null
            //upload the file on cloudinary server
            const response=await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
            })
            //the file has been uploaded successfully
            // console.log("file is uploaded successfully on cloudinary server",
            // response.url);
            fs.unlinkSync(localFilePath)
            return response
        } catch(error){
            fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation go failed
            return null;
        }
    }

    export {uploadOnCloudinary}