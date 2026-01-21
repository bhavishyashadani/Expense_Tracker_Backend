const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

module.exports = model;