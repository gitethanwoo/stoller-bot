import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { OpenAI } from 'openai';
import { Index } from '@upstash/vector';

export const maxDuration = 300;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const openai = new OpenAI();

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Function to chunk text into smaller segments with overlap
function chunkText(text: string, chunkSize: number = 2000, overlapPercentage: number = 40): string[] {
  const chunks: string[] = [];
  const overlap = Math.floor(chunkSize * (overlapPercentage / 100));
  const stride = chunkSize - overlap;
  
  // Clean and normalize text
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  // If text is shorter than chunk size, return it as a single chunk
  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }
  
  // Create chunks with overlap
  for (let i = 0; i < cleanedText.length; i += stride) {
    const end = Math.min(i + chunkSize, cleanedText.length);
    chunks.push(cleanedText.slice(i, end));
    
    // If we've reached the end of the text, break
    if (end === cleanedText.length) break;
  }
  
  return chunks;
}

// This endpoint vectorizes a document and stores it in Upstash Vector
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ENRICH_PASSWORD}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ success: false, message: 'No document key provided' }, { status: 400 });
    }

    // Fetch the document from Redis
    const doc = await redis.get<string>(key);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    // Parse the document
    let document;
    try {
      document = typeof doc === 'string' ? JSON.parse(doc) : doc;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid document format' }, { status: 400 });
    }

    // Extract content for chunking
    const { title, text } = document;
    if (!text) {
      return NextResponse.json({ success: false, message: 'Document has no text content' }, { status: 400 });
    }

    // Chunk the document
    const chunks = chunkText(text);
    
    // Process each chunk
    const results = await Promise.all(
      chunks.map(async (chunk, index) => {
        try {
          // Generate embedding with OpenAI
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk,
            dimensions: 1536
          });
          
          const embedding = response.data[0].embedding;
          
          // Create a unique ID for this chunk
          const chunkId = `${key}:chunk:${index}`;
          
          // Store in Upstash Vector
          await vectorIndex.upsert({
            id: chunkId,
            vector: embedding,
            metadata: {
              text: chunk,
              source: key,
              title,
              chunkIndex: index
            }
          });
          
          return { success: true, chunkId };
        } catch (error: unknown) {
          console.error(`Error processing chunk ${index}:`, error);
          return { 
            success: false, 
            chunkIndex: index, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );
    
    // Count successful and failed operations
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Update the original document in Redis to mark it as vectorized
    if (successful > 0) {
      document.vectorized = true;
      document.vectorizedAt = new Date().toISOString();
      document.vectorChunks = successful;
      await redis.set(key, JSON.stringify(document));
    }
    
    return NextResponse.json({
      success: true,
      totalChunks: chunks.length,
      successful,
      failed,
      document: { key, title }
    });
    
  } catch (error: unknown) {
    console.error('Error in vectorize operation:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to vectorize document' }, 
      { status: 500 }
    );
  }
}

// Endpoint to search the vector database
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    
    if (!query) {
      return NextResponse.json({ success: false, message: 'No query provided' }, { status: 400 });
    }
    
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
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error: unknown) {
    console.error('Error in vector search operation:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to search vectors' }, 
      { status: 500 }
    );
  }
} 