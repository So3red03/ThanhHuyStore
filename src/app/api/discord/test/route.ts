import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Discord test endpoint working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('Test endpoint received:', body);

    // Parse body if it's JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      parsedBody = body;
    }

    // If it's a Discord PING (type: 1), respond with PONG (type: 1)
    if (parsedBody?.type === 1) {
      console.log('Responding to PING with PONG');
      return new NextResponse(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return NextResponse.json({
      message: 'Test endpoint received POST',
      body: parsedBody,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
