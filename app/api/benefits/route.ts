import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';


export const maxDuration = 300;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    // Get all keys starting with 'docs:'
    const keys = await redis.keys('docs:*');
    
    // Fetch all documents
    const documents = await Promise.all(
      keys.map(async (key) => {
        const doc = await redis.get<string>(key);
        try {
          // Check the type of the document and parse accordingly
          let parsedDoc;
          if (typeof doc === 'string') {
            parsedDoc = JSON.parse(doc);
          } else if (typeof doc === 'object') {
            parsedDoc = doc; // Already parsed
          } else {
            return null; // Unexpected format, skip
          }
          
          // Return document with its Redis key
          return {
            ...parsedDoc,
            redisKey: key // Include the actual Redis key
          };
        } catch (error) {
          console.error(`Error parsing document for key ${key}:`, error);
          return null;
        }
      })
    );

    // Filter out any null values and return
    return NextResponse.json(
      documents.filter(doc => doc !== null)
    );
    
  } catch (error) {
    console.error('Error loading documents:', error);
    return NextResponse.json(
      { error: 'Failed to load documents' }, 
      { status: 500 }
    );
  }
}

// Add DELETE method
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ENRICH_PASSWORD}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key } = body;
    if (!key) {
      return NextResponse.json({ success: false, message: 'No key provided' }, { status: 400 });
    }

    const deleteResult = await redis.del(key);
    return NextResponse.json({ 
      success: true, 
      deleteResult
    });
    
  } catch (error) {
    console.error('Error in DELETE operation:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' }, 
      { status: 500 }
    );
  }
}

// Add POST method
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ENRICH_PASSWORD}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.text(); // Get raw text first
    let document;
    try {
      document = JSON.parse(body); // Parse it ourselves for better error handling
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json({ success: false, message: 'Invalid JSON format' }, { status: 400 });
    }

    const { fileName } = document;
    if (!fileName) {
      return NextResponse.json({ success: false, message: 'No fileName provided' }, { status: 400 });
    }

    // Create a safe key from the filename
    const key = `docs:${fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.json`;
    
    // Store the document
    await redis.set(key, JSON.stringify(document));

    return NextResponse.json({ 
      success: true, 
      key
    });
    
  } catch (error) {
    console.error('Error in POST operation:', error);
    return NextResponse.json(
      { error: 'Failed to store document' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ENRICH_PASSWORD}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.text(); // Get raw text first
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json({ success: false, message: 'Invalid JSON format' }, { status: 400 });
    }

    const { key, document } = data;
    if (!key || !document) {
      return NextResponse.json({ success: false, message: 'Missing key or document' }, { status: 400 });
    }

    // Store the updated document
    await redis.set(key, JSON.stringify(document));

    return NextResponse.json({ 
      success: true,
      key
    });
    
  } catch (error) {
    console.error('Error in PUT operation:', error);
    return NextResponse.json(
      { error: 'Failed to update document' }, 
      { status: 500 }
    );
  }
}


