/*
require('dotenv').config({path: './env'});
*/

// ----Better version of above code is given below:------------------------------------------------

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!!", err);
})

/* --first approach of connecting to a database by making IIFE in index file itself ,used try catch error handling n used async as well
import mongoose from "mongoose";
import { DB_NAME } from "./constants";

import express from "express";
const app = express()

( async() => {
    try{
        await mongoose.connect(`${process.env.
        MONGODB_URI}/${DB_NAME}}`)
        app.on("error", (error) => {
            console.log("ERROR:", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on $
                {process.env.PORT}`);
        })

    } catch(error){
        console.error("ERROR:", error)
        throw err
    }
})()

*/
