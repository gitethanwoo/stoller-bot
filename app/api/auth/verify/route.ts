import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // Use server-side env variable
    const correctPassword = process.env.ENRICH_PASSWORD;
    
    if (password === correctPassword) {
      // You might want to generate a session token here instead
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
