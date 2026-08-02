const express = require("express");
const submitRouter = express.Router();
const userMiddleWare = require("../middleware/usermiddleWare");
const submitCodeRateLimiter = require("../middleware/SubmitCodeRateLimiter");
const {submitCode, runCode} = require("../controllers/userSubmission");

submitRouter.post("/submit/:id", userMiddleWare, submitCode);
submitRouter.post("/run/:id", userMiddleWare, submitCodeRateLimiter, runCode);
module.exports = submitRouter;