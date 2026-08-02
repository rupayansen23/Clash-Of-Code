const axios = require('axios');

const getLanguageId = (lang)=>{
    const language = {
        "c++" :54,
        "java" :62,
        "javascript":63,
    }
    return language[lang.toLowerCase()];
}
const submitBatch = async (submissionsArr)=>{
    
    const options = {
        method: 'POST',
        url: 'https://ce.judge0.com/submissions/batch',
        params: {
            base64_encoded: 'true'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            submissions : submissionsArr
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    return await fetchData();
}

const waiting = async (timer) => {
    setTimeout(()=>{
        return 1;
    }, timer)
}

const submitToken = async (resultToken)=>{
    const options = {
        method: 'GET',
        url: 'https://ce.judge0.com/submissions/batch',
        params: {
            tokens: resultToken.join(","),
            base64_encoded: 'true',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error.message);
        }
    }

    while(true) {
        const result = await fetchData();
        const isResultObtained = result.submissions.every((r)=>r.status_id > 2);
        if(isResultObtained) {
            return result.submissions;
        }
        await waiting(1000);
    }

}

module.exports = {getLanguageId, submitBatch, submitToken};