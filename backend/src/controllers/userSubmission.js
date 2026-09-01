const Problem = require("../models/problem");
const Submission = require("../models/submissions");
const { getLanguageId, submitBatch, submitToken } = require("../utils/problemUtility");

const submitCode = async(req, resp) => {
    try{

        const userId = req.user._id;
        const problemId = req.params.id;

        const {code, language} = req.body;
        if(!userId || !problemId || !code || !language) {
            return resp.status(400).send("Some field is missing");
        }
        //fetch problem from the database;
        const problem = await Problem.findById(problemId);
        // console.log(problem);
        const submittedResult = await Submission.create({
            userId,
            problemId,
            code, 
            language,
            status:'pending',
            testCasesTotal: problem.invisibleTestCases.length
        })
        console.log(problem.invisibleTestCases.length);
        const languageId = getLanguageId(language);

        const submissions = problem.invisibleTestCases.map((testCase)=>({
            source_code: Buffer.from(code).toString('base64'),
            language_id: languageId,
            stdin: Buffer.from(testCase.input).toString('base64'),
            expected_output: Buffer.from(testCase.output).toString('base64')
        }))

        // const submissions = problem.invisibleTestCases.map((testcase)=>({
        //     source_code:code,
        //     language_id: languageId,
        //     stdin: testcase.input,
        //     expected_output: testcase.output
        // }));


        console.log("Hii 2");
        const submitResult = await submitBatch(submissions);


        const resultToken = submitResult.map((value)=>value.token);
        const testResult = await submitToken(resultToken);
        console.log(testResult);
        
        
        let runtime = 0;
        let memory = 0;
        let testcasePassed = 0;
        let status = "accepted";
        let error_message = null;

        for(const test of testResult) {
            if(test.status_id == 3) {
                testcasePassed++;
                runtime += parseFloat(test.time);
                memory = Math.max(memory, test.memory)
            } 
            else {
                if(test.status_id == 4) {
                    status = "error";
                    error_message = test.stderr;
                }
                else {
                    status = "wrong";
                    error_message = test.stderr;
                }
            }
        }

        
        //store the result into database
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;
        submittedResult.errorMessage = error_message;
        submittedResult.testCasesPassed = testcasePassed;
        submittedResult.status = status;
        
        await submittedResult.save();

        // if(!req.user.problemSolved.includes(problemId)) {
        //     req.user.problemSolved.push(problemId);
        //     await req.user.save();
        // }

        // ✅ ONLY ADD TO SOLVED PROBLEMS IF ACCEPTED
        if (status === 'accepted') {
            const problemIdStr = problemId.toString();
            const alreadySolved = req.user.problemSolved.some(
                id => id.toString() === problemIdStr
            );
            
            if (!alreadySolved) {
                req.user.problemSolved.push(problemId);
                await req.user.save();
                console.log(`✅ User ${userId} solved problem ${problemId}`);
            }
        }

        resp.status(201).send(submittedResult);

        

    }
    catch(error) {
        resp.status(500).send("Internal Server Error"+error);
    }
}

const runCode = async(req, resp) => {
    try{

        const userId = req.user._id;
        const problemId = req.params.id;

        console.log(problemId);

        const {code, language} = req.body;
        if(!userId || !problemId || !code || !language) {
            return resp.status(400).send("Some field is missing");
        }
        //fetch problem from the database;
        const problem = await Problem.findById(problemId);
    
        console.log(problem.invisibleTestCases.length);
        const languageId = getLanguageId(language);

        const submissions = problem.visibleTestCases.map((testCase)=>({
            source_code: Buffer.from(code).toString('base64'),
            language_id: languageId,
            stdin: Buffer.from(testCase.input).toString('base64'),
            expected_output: Buffer.from(testCase.output).toString('base64')
        }))

        console.log("Hii 2");
        const submitResult = await submitBatch(submissions);

        const resultToken = submitResult.map((value)=>value.token);
        const testResult = await submitToken(resultToken);
        console.log(testResult);

        resp.status(201).send(testResult);

    }
    catch(error) {
        resp.status(500).send("Internal Server Error"+error);
    }
}

module.exports = {submitCode, runCode};