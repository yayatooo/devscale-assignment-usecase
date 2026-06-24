import { getModel } from "./utils";
import z from "zod";
import "dotenv/config";
import { createParsedCompletion } from "@anvia/core";
import { PROMPT_INTENT } from "./prompt-intent";

export const PromptIntentSchema = z.object({
  intent: z.enum(["technical", "billing", "general"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  urgency: z.enum(["low", "medium", "high"]),
  hasEnoughContext: z.boolean(),
  missingInformation: z.array(
    z.enum([
      "order_id",
      "invoice_id",
      "transaction_reference",
      "charge_amount",
      "charge_date",
      "payment_method_type",
      "transaction_status",
      "order_confirmation_count",
      "error_message",
      "device_or_browser",
      "account_email",
    ]),
  ),
  suggestedNextStep: z.enum([
    "ask_clarifying_questions",
    "provide_troubleshooting_steps",
    "request_transaction_verification",
    "provide_general_answer",
    "handoff_to_human",
  ]),
});

type PromptIntent = z.infer<typeof PromptIntentSchema>;

const FIELD_LABELS = {
  order_id: "Order ID",
  invoice_id: "Invoice ID",
  transaction_reference: "transaction reference",
  charge_amount: "amount of each charge",
  charge_date: "date of each charge",
  payment_method_type:
    "payment method type, for example card, bank transfer, or e-wallet",
  transaction_status:
    "status of each transaction: pending, completed, or reversed",
  order_confirmation_count:
    "whether you received one or multiple order confirmations",
  error_message: "the error message shown",
  device_or_browser: "device and browser used",
  account_email: "email address used during checkout",
} as const;

function createBillingVerificationMessage(
  missingInformation: PromptIntent["missingInformation"],
) {
  const requestedFields = missingInformation
    .map((field) => `- ${FIELD_LABELS[field]}`)
    .join("\n");

  return `I understand this is concerning, and I’ll help check it step by step.

Before we can confirm whether this is a duplicate payment or a pending authorization, please share:

${requestedFields}

For your security, please do not send your full card number, CVV, PIN, password, or OTP.

Once we have those details, we can continue with transaction verification.`;
}

function createUserResponse(route: PromptIntent) {
  if (
    route.intent === "billing" &&
    route.suggestedNextStep === "request_transaction_verification"
  ) {
    return createBillingVerificationMessage(route.missingInformation);
  }

  if (route.intent === "technical") {
    return "I'll help you investigate the issue, Please Share the error message and the device or browser";
  }
}

async function main(prompt: string) {
  const extractedIntent = await createParsedCompletion(getModel(), {
    instructions: `
      You are an intent router for a customer support system.

      Do not answer the customer directly.
      Do not diagnose payment issues.
      Do not promise refunds or account actions.

      Classify the message into:
      - billing: charges, duplicate payments, invoices, refunds, subscriptions
      - technical: bugs, errors, login failures, broken features
      - general: other support questions

      For possible duplicate charges:
      - use intent "billing"
      - set hasEnoughContext to false unless transaction details are provided
      - use "request_transaction_verification" as suggestedNextStep
      - list only relevant missingInformation
      `,
    input: `User Input : ${prompt}`,
    schema: PromptIntentSchema,
  });

  const route = extractedIntent.data;
  // Internal system/debugging log
  // console.log("Router result:");
  // console.dir(route, { depth: null });

  // Prompt yang nantinya dipakai jika kamu membuat AI specialist kedua
  // console.log("\nSelected specialist prompt:");
  console.log(PROMPT_INTENT[route.intent]);

  // Response yang aman dibaca customer
  const customerResponse = createUserResponse(route);

  console.log("\nCustomer response:");
  console.log(customerResponse);
}

main("Why was I charged twice? Please fix it now");
