const {getLanguageId, submitBatch, submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const { findById } = require("../models/user");
const Submission = require("../models/submissions");


const problemCreate = async (req, resp) => {
    const {
        referenceSolution,
        visibleTestCases
    } = req.body;

    try {

        for (const { language, completeCode } of referenceSolution) {

            const languageId = getLanguageId(language);

            const submissions = visibleTestCases.map(testCase => ({
                source_code: Buffer.from(completeCode).toString("base64"),
                language_id: languageId,
                stdin: Buffer.from(testCase.input).toString("base64"),
                expected_output: Buffer.from(testCase.output).toString("base64"),
            }));

            const submitResult = await submitBatch(submissions);
            const resultToken = submitResult.map(v => v.token);

            const testResult = await submitToken(resultToken);
            console.log(testResult);

            for (const test of testResult) {
                if (test.status.id !== 3) {
                    return resp.status(400).send(
                        `Test case failed: ${test.status.description}`
                    );
                }
            }
        }

        await Problem.create({
            ...req.body,
            problemCreator: req.user._id
        });

        return resp.status(201).send("Problem Saved Successfully");

    } catch (error) {
        return resp.status(500).send(error.message);
    }
};

const updateProblem = async(req, resp) => {
    const {id} = req.params;
    const {title, description, difficulty, tags,
        visibleTestCases, invisibleTestCases, startCode, 
        referenceSolution
    } = req.body;
    try {

        if(!id) {
            return resp.status(400).send("Missing Id")
        }
        const DsaProblem = await Problem.findById(id);
        if(!DsaProblem) 
            return resp.status(404).send("Id is not present in the server");

        for(const {language, completeCode} of referenceSolution) {
            const languageId = getLanguageId(language);

            const submissions = visibleTestCases.map((testCase)=>({
                source_code: Buffer.from(completeCode).toString('base64'),
                language_id:languageId,
                stdin: Buffer.from(testCase.input).toString('base64'),
                expected_output: Buffer.from(testCase.output).toString('base64')
            }))
            const submitResult = await submitBatch(submissions);
            const resultToken = submitResult.map((value)=>value.token);

            
            const testResult = await submitToken(resultToken);

            for(const test of testResult) {
                if(test.status.id != 3) {
                    return resp.status(400).send(`Test case failed: ${test.status.description}`);
                }
            }

        }   
        const updatedProblem = await Problem.findByIdAndUpdate(id, {...req.body}, {runValidators:true, new:true})
        resp.status(200).send(updatedProblem);
    }
    catch(error) {
        resp.status(404).send("Error : "+error);
    }
}

const deleteProblem = async(req, resp) => {
    const {id} = req.params;
    try {
        if(!id) 
            return resp.status(400).send("id is missing");

        const deletedProblem = await Problem.findByIdAndDelete(id);
        if(!deletedProblem) {
            return resp.status(404).send("The problem is missing");
        }
        return resp.status(200).send("Successfully deleted");
    }
    catch(error) {
        return resp.status(500).send("Error : "+error);
    }
}

const getProblemById = async(req, resp) => {

    const {id} = req.params;
    try {
        if(!id) 
            return resp.status(400).send("Id is missing");
        const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode');
        if(getProblem.length==0) 
            return resp.status("problem is missing");
        resp.status(200).send(getProblem);
    }
    catch(error) {
        return resp.status(500).send("Error : "+error)
    }
}

const getAllProblem = async(req, resp) => {
    try {
        const allProblems = await Problem.find({}).select('_id title difficulty tags');
        if(!allProblems) 
            return resp.status(404).send("No Problems exists");
        return resp.status(200).send(allProblems);
    }
    catch(error) {
        return resp.status(500).send("Error : "+error);
    }
}

const solvedAllProblemByUser = async(req, resp) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate({
            path: "problemSolved",
            select: "_id title difficulty tags"
        });
        resp.status(200).send(user);
    }
    catch(error) {
        return resp.status(500).send("Error : "+error);
    }
}

const submittedProblem = async(req, resp) => {
    try {
        const userId = req.user._id;
        const problemId = req.params.pid;
        const answer = await Submission.find({userId, problemId});

        if(answer.length == 0) {
            res.status(200).send("No submission present");
        }
        resp.status(200).send(answer);
    }
    catch(error) {
        return resp.status(500).send("Internal Server error");
    }
}

module.exports = {problemCreate, updateProblem, deleteProblem, getProblemById, getAllProblem, solvedAllProblemByUser, submittedProblem};