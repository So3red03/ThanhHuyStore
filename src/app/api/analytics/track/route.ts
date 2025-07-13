import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { EventType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    const { eventType, entityType, entityId, metadata, sessionId, path, referrer } = body;

    // Validate eventType
    if (!Object.values(EventType).includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Get user agent and IP from headers
    const userAgent = request.headers.get('user-agent');
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Validate and process entityId for ObjectId compatibility
    let processedEntityId = null;
    if (entityId) {
      // Check if entityId is a valid ObjectId format (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (objectIdRegex.test(entityId)) {
        processedEntityId = entityId;
      } else {
        // If not a valid ObjectId, skip storing entityId or convert to null
        console.warn(`[ANALYTICS] Invalid ObjectId format for entityId: ${entityId}`);
        processedEntityId = null;
      }
    }

    // Prevent duplicate events within short time window (5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existingEvent = await prisma.analyticsEvent.findFirst({
      where: {
        userId: currentUser?.id || null,
        sessionId: sessionId || null,
        eventType,
        entityType,
        entityId: processedEntityId,
        path,
        timestamp: {
          gte: fiveSecondsAgo
        }
      }
    });

    if (existingEvent) {
      return NextResponse.json({
        success: true,
        eventId: existingEvent.id,
        duplicate: true
      });
    }

    // Create analytics event
    const analyticsEvent = await prisma.analyticsEvent.create({
      data: {
        userId: currentUser?.id || null,
        sessionId: sessionId || null,
        eventType,
        entityType,
        entityId: processedEntityId,
        metadata: {
          ...metadata,
          originalEntityId: entityId // Store original value in metadata
        },
        userAgent,
        ipAddress,
        referrer,
        path,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      eventId: analyticsEvent.id
    });
  } catch (error: any) {
    console.error('[ANALYTICS_TRACK]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
