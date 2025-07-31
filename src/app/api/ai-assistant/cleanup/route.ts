import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Delete AIMemory records older than 10 days
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const deletedMemories = await prisma.aIMemory.deleteMany({
      where: {
        createdAt: {
          lt: tenDaysAgo
        }
      }
    });

    // 2. Delete old notifications (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // 3. Clean up duplicate AIMemory records (same alertId, keep latest)
    const duplicateGroups = await prisma.aIMemory.groupBy({
      by: ['alertId'],
      _count: {
        alertId: true
      },
      having: {
        alertId: {
          _count: {
            gt: 1
          }
        }
      }
    });

    let duplicatesRemoved = 0;
    for (const group of duplicateGroups) {
      // Keep only the latest record for each alertId
      const records = await prisma.aIMemory.findMany({
        where: { alertId: group.alertId },
        orderBy: { createdAt: 'desc' }
      });

      if (records.length > 1) {
        const toDelete = records.slice(1); // Keep first (latest), delete rest
        await prisma.aIMemory.deleteMany({
          where: {
            id: {
              in: toDelete.map(r => r.id)
            }
          }
        });
        duplicatesRemoved += toDelete.length;
      }
    }

    console.log(`🧹 [CLEANUP] Database cleanup completed:
      - Deleted ${deletedMemories.count} old AIMemory records (>10 days)
      - Deleted ${deletedNotifications.count} old notifications (>30 days)  
      - Removed ${duplicatesRemoved} duplicate AIMemory records`);

    return NextResponse.json({
      success: true,
      deletedMemories: deletedMemories.count,
      deletedNotifications: deletedNotifications.count,
      duplicatesRemoved,
      message: `Cleanup completed: ${deletedMemories.count + deletedNotifications.count + duplicatesRemoved} records removed`
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
