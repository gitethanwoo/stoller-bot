import { openai } from "@ai-sdk/openai";

import { streamText, convertToCoreMessages, smoothStream } from "ai";
import { z } from "zod";

// Cost constants
const COSTS = {
  'gpt-4o': {
    input: 2.50,
    cachedInput: 1.25,
    output: 10.00,
  },
  'gpt-4.1-mini': {
    input: 0.400,
    cachedInput: 0.10,
    output: 0.160,
  },
  'o3-mini': {
    input: 1.10,
    cachedInput: 0.55,
    output: 4.40,
  }
} as const;

const BenefitsDataSchema = z
  .array(
    z.object({
      documentTitle: z.string(),
      documentContext: z.string(),
    })
  )
  .default([]);

// Add type safety for request body
const RequestSchema = z.object({
  messages: z.array(
    z.object({
      content: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      experimental_attachments: z
        .array(
          z.object({
            url: z.string(),
            name: z.string().optional(),
            contentType: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  benefitsData: BenefitsDataSchema,
});

const SYSTEM_PROMPT = `You are a knowledgeable chatbot assistant dedicated to providing insights about the included information. Your role is to answer questions accurately and concisely, maintaining a casual yet professional tone. Express enthusiasm and a genuine interest in helping users understand the information, while ensuring your responses are grounded in the information explicitly provided in the context. While we present the research and findings, currently, we do not make any explicit or implicit recommendations about the best path forward. Your job is to help users understand the research and findings, but do not be opinionated. Give multiple perspectives and let the user decide. 

When formatting responses:
- Start with a brief introduction paragraph (1-2 sentences)
- Use headers to organize information hierarchically:
  * Use ### for main sections
  * Use #### for subsections
  * Never skip header levels
- Keep lists concise and use them sparingly:
  * Always use markdown asterisks (* ) for bullet points, never use (•) or other symbols
  * Use bullet points only for brief, related items
  * Prefer headers over bullet points for major topics
- Use tables for comparing data:
  * Use tables when comparing 2+ items across common attributes
  * Keep tables simple with 2-4 columns maximum
  * Always include a header row
  * Example format:
    | Model | Description | Key Benefit |
    |-------|------------|-------------|
    | PBS | Sponsorship-based | Free for all |
- Format for readability:
  * Break up dense text into smaller paragraphs
  * Use bold (**text**) for emphasis, not for structure
  * Add a line break between sections
- Avoid:
  * ASCII art or decorative elements
  * Nested lists deeper than one level
  * Bullet points for main topics (use headers instead)
  * Special characters or symbols for formatting (stick to standard markdown)

While the background context is highly informational, do not use too many formatting cues from it, as the data is a bit messy. Stick to classic, well-organized markdown with proper hierarchy.

If you encounter any uncertainties, be transparent and suggest seeking clarification. Encourage users to elaborate on their questions if needed. Do not be lazy. Do not hallucinate. Answer the questions fully - do not leave out any pertinent information.`;

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, benefitsData = [] } = RequestSchema.parse(body);
    const parsedBenefitsData = BenefitsDataSchema.parse(benefitsData);

    console.log(
      `Processing chat with ${parsedBenefitsData.length} benefit documents`
    );

    // Format the benefits data into a string
    const benefitsContext = benefitsData
      .map(({ documentTitle, documentContext }) => {
        return `Document: ${documentTitle}\nContext: ${documentContext}`;
      })
      .join('\n\n');

    const model = "gpt-4.1-mini" as const;
    const result = await streamText({
      model: openai(model),
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: 'word',
      }),
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\n*RAW BACKGROUND CONTEXT:*\n\n${benefitsContext}`,
        },
        ...convertToCoreMessages(messages),
      ],
      onStepFinish: (stepResult) => {
        const cachedPromptTokens = Number(stepResult.experimental_providerMetadata?.openai?.cachedPromptTokens ?? 0);
        const nonCachedPromptTokens = Number(stepResult.usage.promptTokens) - cachedPromptTokens;
        
        const rates = COSTS[model];
        const inputCost = (nonCachedPromptTokens * rates.input + cachedPromptTokens * rates.cachedInput) / 1_000_000;
        const outputCost = (Number(stepResult.usage.completionTokens) * rates.output) / 1_000_000;
        const totalCost = inputCost + outputCost;
        
        console.log('\n=== Chat Response Metrics ===');
        console.log('Model:', model);
        console.log('Token Usage:', {
          promptTokens: stepResult.usage.promptTokens,
          completionTokens: stepResult.usage.completionTokens,
          totalTokens: stepResult.usage.totalTokens,
          cachedPromptTokens
        });
        console.log('Estimated Cost:', {
          inputCost: `$${inputCost.toFixed(4)}`,
          outputCost: `$${outputCost.toFixed(4)}`,
          totalCost: `$${totalCost.toFixed(4)}`
        });
        console.log('===========================\n');
      }
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
