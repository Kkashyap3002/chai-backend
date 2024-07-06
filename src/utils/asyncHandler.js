//---------Method:1-using Promises{invoke promise,resolve then reject}--------------------------------
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res,next)).catch
        ((err) => next(err))
    }
}

export {asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async() => {}


/*  ---------Method:2-using try catch(read nodeJs api error)---------------------------------
    const asyncHandler = (fn) => async (req , res , next) => {
    try {
        await fn(req , res , next );
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: error.message
        });
    }
}
*/