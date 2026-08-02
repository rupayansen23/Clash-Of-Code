const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, resp, next)=>{
    try {
        const {token} = req.cookies;
        if(!token) {
            throw new Error("Token is not present");
        }
        const payload = jwt.verify(token, process.env.JWT_KEY);
        const {_id} = payload;
        if(!_id) {
            throw new Error("Invalid Token");
        }
        if(payload.role != 'admin') {
            throw new Error("Invalid Token");
        }
        const user = await User.findById(_id);
        if(!user) {
            throw new Error("User not exists");
        }

        const isBlocked = await redisClient.exists(`token:${token}`);
        if(isBlocked) {
            throw new Error("Invalid Token Hii");
        }
        // req.result = result;
        req.user = user;
        next();
    }
    catch(error) {
        resp.send("Error Message : "+error);
    }
}
module.exports = adminMiddleware;