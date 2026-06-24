import { getModel, tavilyClient } from "./utils";
import z from "zod";
import "dotenv/config";
import { createParsedCompletion } from "@anvia/core";

const SearchQuariesSchema = z.object({
  queries: z.array(z.string()),
});

const userInput = "PT Astra International Tbk";

const SYSTEM_PROMPT = `
  You are an expert in company research, What you need to find is detailed company informations
  including the company's name, industry, location, and any other relevant details.

  Generate 5 most important query to be searched in google to get the most detailed information about the company.
  `;

const response = await createParsedCompletion(getModel(), {
  instructions: SYSTEM_PROMPT,
  input: `User Input: ${userInput}`,
  schema: SearchQuariesSchema,
});

console.log(response.data.queries);

const data = await Promise.all(
  response.data.queries.map(async (query) => {
    const searchResult = await tavilyClient.search(query, {
      searchDepth: "basic",
    });
    return searchResult;
  }),
);

console.log(data);
