const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submissions");
const register = async (req, resp) =>{

    try{
        validate(req.body);
        const {firstName, lastName, emailId, password} = req.body;
        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'admin';
        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id, emailId:emailId, role:'user'}, process.env.JWT_KEY, {expiresIn:60*60});
        resp.cookie('token', token, {maxAge: 60*60*1000});
        const response = {
            firstName : user.firstName,
            lastName : user.lastName,
            emailId : user.emailId,
            userId : user._id
        }
        resp.status(201).send(response);
    }
    catch(err) {
        resp.status(400).send("Error : "+err);
    }
}

const login = async (req, resp) => {
    try {
        const {emailId, password} = req.body;
        if(!emailId) 
            throw new Error("Invalid Credentials");
        if(!password) 
            throw new Error("Invalid Credentials");
 
        const user = await User.findOne({emailId});
        const match = bcrypt.compare(user.password, password);
        if(!match) {
            throw new Error("invalid credentials")
        }
        const token = jwt.sign({_id:user._id, emailId:emailId, role:user.role}, process.env.JWT_KEY, {expiresIn:60*60});
        resp.cookie('token', token, {maxAge: 60*60*1000});
        const response = {
            firstName : user.firstName,
            lastName : user.lastName,
            emailId : user.emailId,
            userId : user._id
        }
        resp.status(200).send(response);

    }
    catch(err) {
        resp.status(401).send("Error : "+err);
    }
}

const logout = async(req, resp)=>{
    try {
        const {token} = req.cookies;
        const payload = jwt.decode(token);
        await redisClient.set(`token:${token}`, 'blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);
        resp.cookie("token", null,{expires: new Date(Date.now())});
        // resp.clearCookie('token');
        resp.send("logged out successfully");
    }
    catch(err) {
        resp.status(503).send("Error : "+err);
    }
}

const adminRegister = async(req, resp)=>{
     try{
        validate(req.body);
        const {firstName, lastName, emailId, password} = req.body;
        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'admin';
        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id, emailId:emailId, role:'admin'}, process.env.JWT_KEY, {expiresIn:60*60});
        resp.cookie('token', token, {maxAge: 60*60*1000});
        resp.status(201).send("User registered successfully")
    }
    catch(err) {
        resp.status(400).send("Error : "+err);
    }
}

const deleteProfile = async(req, resp) => {
    try {
        const userId = req.user._id;
        await User.findByIdAndDelete(userId);

        await Submission.deleteMany({userId});
        resp.status(200).send("Deleted successfully");
    }
    catch(error) {
        resp.status(500).send("Internal Server Error : "+error);
    }
}

module.exports = {register, login, logout, adminRegister, deleteProfile};

//logout feature
