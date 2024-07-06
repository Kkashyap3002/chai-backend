import { asyncHandler } from "../utils/asyncHandler.js";


const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "all setup configured",
    });
});


export {registerUser};