import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

// POST - Mark AI recommendation as resolved
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['ADMIN', 'STAFF'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, eventType, productId, resolvedAt } = body;

    // Generate memory key based on eventType and productId
    let memoryKey = '';

    if (eventType && productId) {
      // For product-specific recommendations
      if (eventType.includes('CRITICAL_INVENTORY')) {
        memoryKey = `critical_inventory_${productId}`;
      } else if (eventType.includes('LOW_STOCK')) {
        memoryKey = `low_stock_${productId}`;
      } else if (eventType.includes('INVENTORY_PLANNING')) {
        memoryKey = `inventory_planning_${productId}`;
      } else if (eventType.includes('PRODUCT_OPTIMIZATION')) {
        memoryKey = `product_optimization_${productId}`;
      } else {
        memoryKey = `${eventType.toLowerCase()}_${productId}`;
      }
    } else if (eventType) {
      // For general recommendations
      memoryKey = eventType.toLowerCase();
    } else if (notificationId) {
      // Fallback to notification ID
      memoryKey = `notification_${notificationId}`;
    } else {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Update AIMemory to mark as resolved
    const updatedMemory = await prisma.aIMemory.upsert({
      where: { alertId: memoryKey },
      update: {
        status: 'RESOLVED',
        contextData: JSON.stringify({
          resolvedAt,
          resolvedBy: currentUser.id,
          resolvedByName: currentUser.name,
          originalEventType: eventType,
          productId
        })
      },
      create: {
        alertId: memoryKey,
        eventType: eventType || 'MANUAL_RESOLVE',
        status: 'RESOLVED',
        reminderCount: 1,
        productId,
        contextData: JSON.stringify({
          resolvedAt,
          resolvedBy: currentUser.id,
          resolvedByName: currentUser.name,
          originalEventType: eventType,
          productId,
          manuallyCreated: true
        })
      }
    });

    // Also mark the notification as read if notificationId provided
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true
        }
      });
    }

    console.log(`✅ AI recommendation resolved: ${memoryKey} by ${currentUser.name}`);

    return NextResponse.json({
      success: true,
      memoryKey,
      resolvedBy: currentUser.name,
      resolvedAt
    });
  } catch (error) {
    console.error('Error resolving AI recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
