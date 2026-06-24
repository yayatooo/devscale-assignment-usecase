import { getModel } from "./utils";
import z from "zod";
import "dotenv/config";
import { createCompletionStream, createParsedCompletion } from "@anvia/core";

const GOAL = `
Analyze the meeting transcript and produce a clear meeting summary.

Identify:
- key decisions that were made,
- risks, blockers, or unresolved issues,
- action items,
- the owner of each action item when mentioned,
- deadlines when mentioned.

Do not invent missing details.
Clearly mark items as "not specified" when an owner or deadline is not stated.
`;

const planSchema = z.object({
  steps: z.array(
    z.object({
      title: z.string(),
      objective: z.string(),
    }),
  ),
});

console.time("pipeline");

const plan = await createParsedCompletion(getModel(), {
  instructions:
    "Break the goal into 5 clear execution steps. each step must have a title and objective",
  input: GOAL,
  schema: planSchema,
});

console.timeLog("pipeline", "plan done");

const stepOutuputs = await Promise.all(
  plan.data.steps.map(async (step) => {
    const output = await createParsedCompletion(getModel(), {
      instructions:
        "Complete this checklist section with concrete, actionable bullets",
      input: `Goal: ${GOAL}
    Section: ${step.title}
    objctive: ${step.objective}`,
      schema: planSchema,
    });

    return {
      title: step.title,
      output: output.text,
    };
  }),
);

console.timeLog("pipeline", "steps done");

const finalChecklist = createCompletionStream(getModel(), {
  instructions:
    "Combine the completed sections into clean launch checklist. Remove Duplicate items.",
  input: JSON.stringify(stepOutuputs, null, 2),
});
console.log(finalChecklist);
console.timeEnd("pipeline");

let finalText = "";
let finalUsage;

for await (const event of createCompletionStream(getModel(), {
  instructions:
    "Combine the completed sections into clean launch checklist. Remove Duplicate items.",
  input: JSON.stringify(stepOutuputs, null, 2),
})) {
  if (event.type === "text_delta") {
    process.stdout.write(event.delta);
    finalText += event.delta;
  }

  if (event.type === "final") {
    finalUsage = event.response.usage;
  }

  if (event.type === "error") {
    console.error("Stream error:", event);
  }
}

console.log(plan.data);
console.log("Usage:", finalUsage);
