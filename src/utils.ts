import { OpenAIClient } from "@anvia/openai";
import { tavily } from "@tavily/core";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAIClient({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  baseUrl: "https://openrouter.ai/api/v1",
  completionApi: "chat",
  headers: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "assignment-llm",
  },
});

export function getModel() {
  return client.completionModel("gpt-5.5");
}

export const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});
