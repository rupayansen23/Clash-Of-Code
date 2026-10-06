const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submissions");
const { GoogleAuth } = require('google-auth-library');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const googleRegister = async (req, resp) => {
    const { credential } = req.body;

    try {
        // 1. Verify token with Google's servers
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // ✅ FIX 1: Destructure 'email' from Google's payload, NOT 'emailId'
        const { sub: googleId, email, name, picture, given_name, family_name } = payload;

        // Fallback logic in case given_name is missing (splits full name):
        const firstName = given_name || name?.split(' ')[0] || 'User';
        const lastName = family_name || name?.split(' ').slice(1).join(' ') || '';

        // 2. Check if user already exists using your DB field 'emailId'
        // ✅ FIX 2: Pass the extracted 'email' to the 'emailId' field
        let user = await User.findOne({ emailId: email });

        if (!user) {
            // Create user with the mapped names
            user = await User.create({
                firstName,
                lastName,
                emailId: email,
                googleId,
                avatar: picture,
            });
        } else if (!user.googleId) {
            // If user registered earlier with email/password, link Google ID
            user.googleId = googleId;
            if (!user.avatar && picture) user.avatar = picture;
            await user.save();
        }
        // 3. Generate your own session JWT
        const appToken = jwt.sign(
            { _id: user._id, emailId: user.emailId, role : 'user' }, // This is fine, matching DB schema
            process.env.JWT_KEY,
            { expiresIn: 60 * 60 }
        );

        // 4. Send token as a secure httpOnly cookie
        resp.cookie('token', appToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        resp.status(200).json({
            message: 'Logged in successfully',
            user: { id: user._id, firstName: user.firstName, emailId: user.emailId }
        });

    } catch (err) {
        console.error('Token verification error:', err);
        resp.status(401).json({ message: 'Invalid Google token' });
    }
}

const register = async (req, resp) => {

    try {
        validate(req.body);
        const { firstName, emailId, password } = req.body;
        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'user';
        const user = await User.create(req.body);
        const token = jwt.sign({ _id: user._id, emailId: emailId, role: 'user' }, process.env.JWT_KEY, { expiresIn: 60 * 60 });
        resp.cookie('token', token, { maxAge: 60 * 60 * 1000 });
        const response = {
            firstName: user.firstName,
            emailId: user.emailId,
            userId: user._id
        }
        resp.status(201).json({
            user: response,
            message: "valid_user"
        });
    }
    catch (err) {
        resp.status(400).send("Error Hello: " + err);
    }
}

const login = async (req, resp) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId)
            throw new Error("Invalid Credentials");
        if (!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({ emailId });
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw new Error("invalid credentials")
        }
        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: 60 * 60 });
        resp.cookie('token', token, { maxAge: 60 * 60 * 1000 });
        const response = {
            firstName: user.firstName,
            lastName: user.lastName,
            emailId: user.emailId,
            role: user.role,
            userId: user._id
        }
        resp.status(200).json({
            user: response,
            message: "valid user"
        });

    }
    catch (err) {
        resp.status(401).send("Error : " + err);
    }
}

const logout = async (req, resp) => {
    try {
        const { token } = req.cookies;
        const payload = jwt.decode(token);
        await redisClient.set(`token:${token}`, 'blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);
        resp.cookie("token", null, { expires: new Date(Date.now()) });
        // resp.clearCookie('token');
        resp.send("logged out successfully");
    }
    catch (err) {
        resp.status(503).send("Error : " + err);
    }
}

const adminRegister = async (req, resp) => {
    try {
        validate(req.body);
        const { firstName, lastName, emailId, password } = req.body;
        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'admin';
        const user = await User.create(req.body);
        const token = jwt.sign({ _id: user._id, emailId: emailId, role: 'admin' }, process.env.JWT_KEY, { expiresIn: 60 * 60 });
        resp.cookie('token', token, { maxAge: 60 * 60 * 1000 });
        resp.status(201).send("User registered successfully")
    }
    catch (err) {
        resp.status(400).send("Error : " + err);
    }
}

const deleteProfile = async (req, resp) => {
    try {
        const userId = req.user._id;
        await User.findByIdAndDelete(userId);

        await Submission.deleteMany({ userId });
        resp.status(200).send("Deleted successfully");
    }
    catch (error) {
        resp.status(500).send("Internal Server Error : " + error);
    }
}

module.exports = { register, login, logout, adminRegister, deleteProfile, googleRegister };

//logout feature
