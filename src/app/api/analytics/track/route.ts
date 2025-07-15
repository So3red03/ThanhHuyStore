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

    // Check for existing record to prevent duplicates (per user + entity + event type)
    // Note: We ignore sessionId to prevent duplicates from different tracking sources
    const existingRecord = await prisma.analyticsEvent.findFirst({
      where: {
        userId: currentUser?.id || null,
        entityId: processedEntityId,
        eventType: eventType
      },
      orderBy: {
        timestamp: 'desc' // Get the most recent record
      }
    });

    // Also check for any other records that might be duplicates (race condition handling)
    const allExistingRecords = await prisma.analyticsEvent.findMany({
      where: {
        userId: currentUser?.id || null,
        entityId: processedEntityId,
        eventType: eventType
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Normalize source name to be consistent
    let newSource = 'unknown';
    if (metadata.clickSource) {
      newSource = metadata.clickSource; // 'ProductCard', 'AnalyticsTracker', etc.
    } else if (metadata.interactionType === 'click') {
      newSource = 'ProductCard'; // Default click source
    } else if (metadata.interactionType === 'view') {
      newSource = 'AnalyticsTracker'; // Default view source
    }

    let analyticsEvent;

    if (existingRecord) {
      // If there are multiple existing records (race condition), merge them all
      if (allExistingRecords.length > 1) {
        console.log(
          `Found ${allExistingRecords.length} duplicate records for user ${currentUser?.id}, entity ${processedEntityId}. Merging...`
        );

        // Merge all metadata from all existing records
        const allMetadata = allExistingRecords.map(record => (record.metadata as any) || {});
        const allSources = [...new Set(allMetadata.flatMap(meta => meta.interactionSources || []))];
        const allSessionIds = [...new Set(allExistingRecords.map(record => record.sessionId).filter(Boolean))];

        // Calculate total interaction count
        const totalInteractionCount = allMetadata.reduce((sum, meta) => sum + (meta.interactionCount || 1), 0);

        // Determine if we have both page views and clicks
        const hasPageView = allMetadata.some(meta => meta.hasPageView || meta.interactionType === 'view');
        const hasClick = allMetadata.some(meta => meta.hasClick || meta.interactionType === 'click');

        // Get earliest and latest timestamps
        const firstInteraction =
          allMetadata
            .map(meta => meta.firstInteraction)
            .filter(Boolean)
            .sort()[0] || allExistingRecords[allExistingRecords.length - 1].timestamp.toISOString();

        const lastInteraction = new Date().toISOString();

        // Delete all existing records except the first one
        if (allExistingRecords.length > 1) {
          await prisma.analyticsEvent.deleteMany({
            where: {
              id: {
                in: allExistingRecords.slice(1).map(record => record.id)
              }
            }
          });
        }

        // Update the remaining record with merged data
        analyticsEvent = await prisma.analyticsEvent.update({
          where: { id: allExistingRecords[0].id },
          data: {
            metadata: {
              ...allMetadata[0], // Base metadata from first record
              ...metadata, // New metadata
              originalEntityId: entityId,
              firstInteraction,
              lastInteraction,
              interactionCount: totalInteractionCount + 1, // +1 for current interaction
              interactionSources: [...allSources, newSource].filter(
                (source, index, arr) => arr.indexOf(source) === index
              ),
              hasPageView: hasPageView || metadata.interactionType === 'view',
              hasClick: hasClick || metadata.interactionType === 'click',
              allSessionIds: [...allSessionIds, sessionId]
                .filter(Boolean)
                .filter((id, index, arr) => arr.indexOf(id) === index)
            },
            userAgent,
            ipAddress,
            referrer,
            path,
            sessionId: sessionId || existingRecord.sessionId
          }
        });
      } else {
        // Single existing record - normal merge
        const existingMeta = (existingRecord.metadata as any) || {};
        const newInteractionCount = (existingMeta.interactionCount || 0) + 1;

        // Determine interaction sources
        const existingSources = existingMeta.interactionSources || [];

        const updatedSources = existingSources.includes(newSource) ? existingSources : [...existingSources, newSource];

        // Update existing record with merged metadata
        analyticsEvent = await prisma.analyticsEvent.update({
          where: { id: existingRecord.id },
          data: {
            metadata: {
              ...existingMeta, // Keep existing metadata
              ...metadata, // Add new metadata
              originalEntityId: entityId,
              lastInteraction: new Date().toISOString(),
              interactionCount: newInteractionCount,
              interactionSources: updatedSources,
              // Track both page views and clicks
              hasPageView: existingMeta.hasPageView || metadata.interactionType === 'view',
              hasClick: existingMeta.hasClick || metadata.interactionType === 'click',
              // Keep session info from both sources
              allSessionIds: [
                ...(existingMeta.allSessionIds || [existingRecord.sessionId].filter(Boolean)),
                sessionId
              ].filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
            },
            userAgent,
            ipAddress,
            referrer,
            path,
            // Update sessionId to latest one
            sessionId: sessionId || existingRecord.sessionId
          }
        });
      }
    } else {
      // Create new record

      analyticsEvent = await prisma.analyticsEvent.create({
        data: {
          userId: currentUser?.id || null,
          sessionId: sessionId || null,
          eventType,
          entityType,
          entityId: processedEntityId,
          metadata: {
            ...metadata,
            originalEntityId: entityId,
            firstInteraction: new Date().toISOString(),
            lastInteraction: new Date().toISOString(),
            interactionCount: 1,
            interactionSources: [newSource],
            // Track interaction types
            hasPageView: metadata.interactionType === 'view',
            hasClick: metadata.interactionType === 'click',
            allSessionIds: [sessionId].filter(Boolean)
          },
          userAgent,
          ipAddress,
          referrer,
          path,
          timestamp: new Date()
        }
      });
    }

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
