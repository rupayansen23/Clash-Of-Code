const express = require("express");
const adminMiddleware = require("../middleware/adminMiddleware");
const {problemCreate, updateProblem, deleteProblem, getProblemById, getAllProblem, solvedAllProblemByUser, submittedProblem} = require("../controllers/userProblem");
const userMiddleWare = require("../middleware/usermiddleWare")
const problemRouter = express.Router();

problemRouter.post("/create", adminMiddleware,  problemCreate);
problemRouter.put("/update/:id", adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);

problemRouter.get("/getProblemById/:id",userMiddleWare, getProblemById);
problemRouter.get("/", userMiddleWare, getAllProblem);
problemRouter.get("/problemSolvedByUser",userMiddleWare, solvedAllProblemByUser);
problemRouter.get("/submittedProblem/:pid", userMiddleWare, submittedProblem);

module.exports = problemRouter;