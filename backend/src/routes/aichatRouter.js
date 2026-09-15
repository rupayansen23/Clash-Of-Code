const express = require("express");
const userMiddleWare = require("../middleware/usermiddleWare");
const chatWithAI = require("../controllers/chatWithAI");
const aiChatRouter = express.Router();

aiChatRouter.post("/chat", userMiddleWare, chatWithAI);

module.exports = aiChatRouter;
