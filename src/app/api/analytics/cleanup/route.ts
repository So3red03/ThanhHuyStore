import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'check_duplicates') {
      // Check for duplicate analytics events
      const duplicates = await prisma.analyticsEvent.groupBy({
        by: ['userId', 'entityId', 'eventType'],
        having: {
          userId: {
            _count: {
              gt: 1
            }
          }
        },
        _count: {
          _all: true
        }
      });

      const duplicateDetails = await Promise.all(
        duplicates.map(async (dup) => {
          const records = await prisma.analyticsEvent.findMany({
            where: {
              userId: dup.userId,
              entityId: dup.entityId,
              eventType: dup.eventType
            },
            orderBy: {
              timestamp: 'desc'
            }
          });

          return {
            userId: dup.userId,
            entityId: dup.entityId,
            eventType: dup.eventType,
            count: dup._count._all,
            records: records.map(r => ({
              id: r.id,
              timestamp: r.timestamp,
              path: r.path
            }))
          };
        })
      );

      return NextResponse.json({
        message: `Found ${duplicates.length} groups with duplicate records`,
        duplicateGroups: duplicates.length,
        totalDuplicateRecords: duplicates.reduce((sum, dup) => sum + dup._count._all, 0),
        details: duplicateDetails
      });

    } else if (action === 'clean_duplicates') {
      // Clean duplicate analytics events - keep the latest one
      const duplicates = await prisma.analyticsEvent.groupBy({
        by: ['userId', 'entityId', 'eventType'],
        having: {
          userId: {
            _count: {
              gt: 1
            }
          }
        }
      });

      let totalDeleted = 0;

      for (const dup of duplicates) {
        // Get all records for this combination
        const records = await prisma.analyticsEvent.findMany({
          where: {
            userId: dup.userId,
            entityId: dup.entityId,
            eventType: dup.eventType
          },
          orderBy: {
            timestamp: 'desc'
          }
        });

        // Keep the latest record, delete the rest
        if (records.length > 1) {
          const recordsToDelete = records.slice(1); // Skip the first (latest) record
          
          const deleteResult = await prisma.analyticsEvent.deleteMany({
            where: {
              id: {
                in: recordsToDelete.map(r => r.id)
              }
            }
          });

          totalDeleted += deleteResult.count;
        }
      }

      return NextResponse.json({
        message: `Successfully cleaned ${totalDeleted} duplicate records`,
        duplicateGroups: duplicates.length,
        recordsDeleted: totalDeleted
      });

    } else if (action === 'stats') {
      // Get analytics statistics
      const totalEvents = await prisma.analyticsEvent.count();
      
      const eventsByType = await prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        _count: {
          _all: true
        }
      });

      const recentEvents = await prisma.analyticsEvent.findMany({
        take: 10,
        orderBy: {
          timestamp: 'desc'
        },
        select: {
          id: true,
          eventType: true,
          entityId: true,
          timestamp: true,
          path: true,
          userId: true
        }
      });

      return NextResponse.json({
        totalEvents,
        eventsByType,
        recentEvents
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[ANALYTICS_CLEANUP]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Quick stats for GET request
    const totalEvents = await prisma.analyticsEvent.count();
    
    const duplicateCheck = await prisma.analyticsEvent.groupBy({
      by: ['userId', 'entityId', 'eventType'],
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        _all: true
      }
    });

    return NextResponse.json({
      totalEvents,
      duplicateGroups: duplicateCheck.length,
      hasDuplicates: duplicateCheck.length > 0,
      actions: {
        check_duplicates: 'POST with {"action": "check_duplicates"}',
        clean_duplicates: 'POST with {"action": "clean_duplicates"}',
        stats: 'POST with {"action": "stats"}'
      }
    });

  } catch (error: any) {
    console.error('[ANALYTICS_CLEANUP_GET]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
