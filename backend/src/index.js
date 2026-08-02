const express = require("express");
const app = express();
require('dotenv').config();
const main = require("./config/db");
const cookieParser = require("cookie-parser");
const userAuthRouter = require("./routes/userAuth");
const redisClient = require("./config/redis");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");

app.use(express.json());
app.use(cookieParser());

app.use("/user", userAuthRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);

const InitilizeConnection = async ()=>{
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("db connected");
        app.listen(process.env.PORT, ()=>{
            console.log("server listening at port number "+ process.env.PORT);
        })
    }
    catch(err) {
        console.log("Error : "+err);
    }
}

InitilizeConnection();

app.use("/user", userAuthRouter);
