import { openai as aiSdkOpenai } from "@ai-sdk/openai";
import { OpenAI } from "openai";
import { Index } from "@upstash/vector";
import { streamText, convertToCoreMessages, smoothStream, tool } from "ai";
import { z } from "zod";

// Initialize OpenAI client for embeddings
const openai = new OpenAI();

// Initialize vector index
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

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
});

const SYSTEM_PROMPT = `# Role and Purpose
You are a knowledgeable chatbot assistant named StollerBot dedicated to providing insights about the Stoller Report. Your purpose is to provide accurate, helpful information based solely on the content in your knowledge base.

# Core Behaviors
- PERSISTENCE: Keep going until the user's query is completely resolved. Only end your turn when you have provided a complete answer.
- TOOL USAGE: For EVERY user question, you should ALWAYS search the knowledge base first using the searchKnowledgeBase tool. If you are not sure about any information, use this tool: do NOT guess or make up an answer.
- PLANNING: Before searching, take a moment to formulate an effective search query. After receiving search results, carefully analyze them before constructing your response.

# Information Guidelines
- Only provide information that is found in the search results.
- If the search doesn't return relevant information, politely inform the user that you don't have that specific information.
- Do not hallucinate information or make up details that were not in the search results.
- Be transparent about uncertainties and suggest ways users might rephrase their questions if needed.

# Communication Style
- Answer questions accurately and concisely
- Maintain a casual yet professional tone
- Express enthusiasm and genuine interest in helping users understand the information

# Response Formatting
## Structure
- Start with a brief introduction paragraph (1-2 sentences)
- Use headers to organize information hierarchically:
  * Use ### for main sections
  * Use #### for subsections
  * Never skip header levels

## Lists and Tables
- Keep lists concise and use them sparingly:
  * Always use markdown asterisks (* ) for bullet points
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

## Readability
- Break up dense text into smaller paragraphs
- Use bold (**text**) for emphasis, not for structure
- Add a line break between sections
- Avoid:
  * ASCII art or decorative elements
  * Nested lists deeper than one level
  * Bullet points for main topics (use headers instead)
  * Special characters or symbols for formatting (stick to standard markdown)`;

// Function to search the vector database
async function searchKnowledgeBase(query: string, limit: number = 5) {
  try {
    // Generate embedding for the query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536
    });
    
    const embedding = response.data[0].embedding;
    
    // Search Upstash Vector
    const results = await vectorIndex.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true
    });
    
    return results;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = RequestSchema.parse(body);

    console.log(`Processing chat request with ${messages.length} messages`);

    const result = await streamText({
      model: aiSdkOpenai('gpt-4.1'),
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: 'word',
      }),
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...convertToCoreMessages(messages),
      ],
      tools: {
        searchKnowledgeBase: tool({
          description: "Search the knowledge base for relevant information to answer the user's question",
          parameters: z.object({
            query: z.string().describe("The user's question or search query"),
          }),
          execute: async ({ query }) => {
            console.log("Searching knowledge base for:", query);
            const results = await searchKnowledgeBase(query);
            
            // Format the results for the model
            if (results.length === 0) {
              return { found: false, message: "No relevant information found in knowledge base" };
            }
            
            const formattedResults = results.map(result => ({
              score: result.score,
              text: result.metadata?.text || "",
              title: result.metadata?.title || "",
              source: result.metadata?.source || "",
            }));
            
            return { 
              found: true, 
              results: formattedResults
            };
          },
        }),
      },
      maxSteps: 5,
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
