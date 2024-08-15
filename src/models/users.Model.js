import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true, // index is true to make username searchable in optimized way: database searching
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true, // index is true to make this field searchable in optimized way: database searching
        },
        avatar:{
            type: String, // cloudinary URL
            required: true,
        },
        coverImage:{
            type: String, // cloudinary URL
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type: String,
            required: [true,"Password is required"]
        },
        refreshToken: {
            type: String,
        }
    },{
        timestamps: true,
    }
);

//pre-hooks in middleware[encryption]
/*** userSchema.pre("save", () => {})   ------this syntax is wrong in pre as arrow fn => in callback does not have ref of this, below one is correct   ***/
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10)
    next()
})

//
userSchema.methods.isPasswordCorrect = async function(password){
        return await bcrypt.compare(password, this.password)
}

//generating Access and Refresh tokens
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}


export const User = mongoose.model("User", userSchema);