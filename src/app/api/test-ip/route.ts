import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger } from '@/app/utils/auditLogger';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Simple IP test endpoint - can be removed after testing
 * GET /api/test-ip
 */
export async function GET(request: NextRequest) {
  try {
    const detectedIP = AuditLogger.getClientIP(request);
    const userAgent = AuditLogger.getUserAgent(request);

    // Get some key headers for verification
    const headers = {
      'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'x-client-ip': request.headers.get('x-client-ip'),
      'remote-addr': request.headers.get('remote-addr'),
    };

    const response = {
      success: true,
      detectedIP,
      userAgent,
      environment: process.env.NODE_ENV,
      headers,
      timestamp: new Date().toISOString(),
      message: detectedIP === 'unknown' 
        ? 'No IP detected - check proxy configuration' 
        : `IP detected successfully: ${detectedIP}`
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('IP Test Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test IP detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
