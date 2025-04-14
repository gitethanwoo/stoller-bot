import { Redis } from '@upstash/redis';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// --- Other File Types ---
import mammoth from 'mammoth'; // Keep commented until needed
import * as xlsx from 'xlsx'; // Add xlsx import

// --- Remove Worker/Shim setup --- 

export const maxDuration = 300;

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// --- Interface Definition (Unified) ---
// Used for data stored in Redis and potentially in SSE response
interface ProcessedFileData {
  title: string;           // Will hold originalFilename
  text: string;
  originalFilename: string; // Store the original file name
  redisKey: string;       // Store the key used in Redis (e.g., docs:sanitized_filename)
}

// --- Helper Functions ---

// Helper to sanitize filename for Redis key (used by all paths now)
function sanitizeFilename(filename: string): string {
  // Remove extension and replace non-alphanumeric characters with underscores
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.')) || filename;
  return nameWithoutExtension.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// --- Processing Functions ---

// processPage (LLM Vision) - Remains the same, used by PDF path
async function processPage(pageData: { pageNum: number; image: string }): Promise<string> {
  try {
    const result = await generateText({
      model: google('gemini-2.0-flash'), // Use a vision-capable model
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Extract all text from this image, preserving formatting and structure. Return ONLY the extracted text in a markdown format, no commentary. For images or charts, do your best to describe the image or chart, maintaining as much information as possible. For tables, you can describe the table in markdown format. Do not prepend the markdown with ```markdown or ```. "
            },
            { 
              type: "image", 
              // Assuming image is base64 encoded string
              image: pageData.image 
            }
          ]
        }
      ]
    });
    return `Page: ${pageData.pageNum}\n\n${result.text}`; 
  } catch (error) {
    console.error(`Error processing page ${pageData.pageNum}:`, error);
    throw error; // Re-throw to be caught by the caller
  }
}

// processXlsx (Server-Side)
async function processXlsx(buffer: ArrayBuffer): Promise<{ text: string }> {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let fullText = '';
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      // Convert sheet to plain text
      const sheetTextRaw = xlsx.utils.sheet_to_txt(sheet); 
      
      // Post-process to remove trailing tabs and empty/whitespace lines
      const sheetTextProcessed = sheetTextRaw
        .split('\n') // Split into lines
        .map(line => line.replace(/\t+$/, '')) // Remove trailing tabs
        .filter(line => line.trim().length > 0) // Filter out empty or whitespace-only lines
        .join('\n'); // Join back into a single string

      // Add sheet header and processed text (only if sheet has content after filtering)
      if (sheetTextProcessed.length > 0) {
        fullText += `--- Sheet: ${sheetName} ---\n\n${sheetTextProcessed}\n\n`;
      }
    });
    return { text: fullText.trim() }; // Trim any final whitespace
  } catch (error) {
    console.error('Error processing XLSX file:', error);
    throw new Error('Failed to process XLSX file');
  }
}

// --- NEW: Server-Side DOCX Processing Function ---
async function processDocx(buffer: ArrayBuffer): Promise<{ text: string }> {
  try {
    // Convert ArrayBuffer to Node.js Buffer
    const nodeBuffer = Buffer.from(buffer);
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
    return { text: result.value }; // The raw text
  } catch (error) {
    console.error('Error processing DOCX file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to process DOCX file: ${errorMessage}`);
  }
}

// --- NEW: PDF Processing Function (Handles pre-processed pages from client) ---
// Takes pages data (image + pageNum + originalFilename) and returns extracted text
async function processPDFClientImages(pagesData: { pageNum: number; image: string; originalFilename: string }[], sendProgress: (message: string) => Promise<void>): Promise<{ text: string }> {
    const numPages = pagesData.length;
    if (numPages === 0) {
        throw new Error('No page data received for PDF processing.');
    }
    await sendProgress(`Processing ${numPages} pages received from client...`);

    const pageContents: string[] = [];
    const BATCH_SIZE = 20; // Batch size for calling LLM

    for (let i = 0; i < numPages; i += BATCH_SIZE) {
        const batchStart = i + 1;
        const batchEnd = Math.min(i + BATCH_SIZE, numPages);
        await sendProgress(`Extracting text from pages ${batchStart}-${batchEnd} of ${numPages}...`);
        
        const batch = pagesData.slice(i, i + BATCH_SIZE);
        // Process batch in parallel
        const batchResults = await Promise.all(
            batch.map(page => processPage({ pageNum: page.pageNum, image: page.image })) // Only need pageNum and image for processPage
        );
        pageContents.push(...batchResults);
    }

    await sendProgress('Combining extracted text...');
    const fullText = pageContents.join('\n\n---\n\n');
    return { text: fullText };
}


export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (message: string) => {
    await writer.write(
      encoder.encode(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`)
    );
  };

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Process files in the background
  (async () => {
    let finalOriginalFilename: string | null = null;
    let finalRedisKey: string | null = null;
    let docToStore: ProcessedFileData | null = null;

    try {
      // Auth check
      const authHeader = req.headers.get('Authorization');
      if (authHeader !== `Bearer ${process.env.ENRICH_PASSWORD}`) {
         throw new Error('Unauthorized');
      }

      // === Detect Input Format (Raw File vs Pre-processed Pages) ===
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const pageEntries = formData.getAll('pages'); // Get all entries with key 'pages'

      let extractedText: string;

      if (file) {
        // --- Handle Raw File Upload (XLSX, DOCX, etc.) ---
        finalOriginalFilename = file.name;
        await sendProgress(`Received file: ${finalOriginalFilename}`);
        const fileType = file.type;
        const fileExtension = finalOriginalFilename.split('.').pop()?.toLowerCase();

        if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileExtension === 'xlsx') {
            await sendProgress('Processing Excel file...');
            const buffer = await file.arrayBuffer();
            const result = await processXlsx(buffer);
            extractedText = result.text;
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx') {
            await sendProgress('Processing Word document...');
            const buffer = await file.arrayBuffer();
            const result = await processDocx(buffer);
            extractedText = result.text;
        } else {
             throw new Error(`Unsupported raw file type: ${fileType || fileExtension}`);
        }

      } else if (pageEntries.length > 0) {
        // --- Handle Pre-processed PDF Pages --- 
        await sendProgress('Received pre-processed PDF pages from client...');
        // Parse the JSON strings back into objects, assuming each contains { pageNum, image, originalFilename }
        const pagesData = pageEntries.map(entry => JSON.parse(entry as string) as { pageNum: number; image: string; originalFilename: string });
        
        if (pagesData.length === 0 || !pagesData[0].originalFilename) {
             throw new Error('Invalid or missing page data received from client.');
        }

        finalOriginalFilename = pagesData[0].originalFilename; // Get filename from the first page
        await sendProgress(`Processing PDF: ${finalOriginalFilename}`);
        
        const result = await processPDFClientImages(pagesData, sendProgress);
        extractedText = result.text;

      } else {
        // Neither raw file nor pages found
        throw new Error('No file or page data provided in the request.');
      }

      // === Common Logic: Store results ===
      await sendProgress('Processing complete. Storing results...');

      if (!finalOriginalFilename) {
          throw new Error('Internal error: Original filename not determined.');
      }

      const title = finalOriginalFilename; // Use original filename as title for all types now
      const sanitizedBase = sanitizeFilename(finalOriginalFilename);
      finalRedisKey = `docs:${sanitizedBase}`; 

      docToStore = {
        title: title,
        text: extractedText,
        originalFilename: finalOriginalFilename,
        redisKey: finalRedisKey,
      };

      await redis.set(finalRedisKey, JSON.stringify(docToStore));
      await sendProgress(`Stored document with key: ${finalRedisKey}`);

      // Send completion message
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          enrichedResults: [{
            success: true,
            title: docToStore.title,
            originalFilename: docToStore.originalFilename,
            redisKey: docToStore.redisKey,
            message: `Successfully processed and stored ${docToStore.originalFilename}`,
          }]
        })}

`)
      );

    } catch (error) {
      console.error('Error in POST handler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error processing file';
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`)
      );
    } finally {
       try {
        await writer.close();
       } catch { 
        // Ignore error if writer already closed
       }
    }
  })(); 

  return response;
}
