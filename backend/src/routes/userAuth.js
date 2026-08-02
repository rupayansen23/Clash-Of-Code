const express = require("express");
const authRouter = express.Router();
const {register, login, logout, adminRegister, deleteProfile} = require("../controllers/userAuthenticate");
const userMiddleWare = require("../middleware/usermiddleWare");
const adminMiddleware = require("../middleware/adminMiddleware");
const { deleteProblem } = require("../controllers/userProblem");

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleWare, logout);
authRouter.post('/admin/register',adminMiddleware, adminRegister);
authRouter.delete('/profile', userMiddleWare, deleteProfile);

module.exports = authRouter;
