// AI Assistant Monitor API - Control real-time business monitoring
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { eventMonitor } from '@/app/libs/ai-assistant/eventMonitor';
import { AIMemoryService } from '@/app/libs/ai-assistant/memoryService';

// GET - Get AI Assistant status and active memories
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active memories
    const activeMemories = await AIMemoryService.getActiveMemories();

    return NextResponse.json({
      success: true,
      data: {
        isActive: true, // TODO: Track actual monitoring status
        activeMemories: activeMemories.length,
        memories: activeMemories.map(memory => ({
          alertId: memory.alertId,
          eventType: memory.eventType,
          productName: memory.productName,
          escalationLevel: memory.escalationLevel,
          reminderCount: memory.reminderCount,
          firstDetected: memory.firstDetected,
          lastReminded: memory.lastReminded,
          businessImpact: memory.businessImpact,
          status: memory.status
        }))
      }
    });
  } catch (error) {
    console.error('Error getting AI Assistant status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Start AI Assistant monitoring
export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await eventMonitor.startMonitoring();

    return NextResponse.json({
      success: true,
      message: 'AI Assistant monitoring started',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error starting AI Assistant:', error);
    return NextResponse.json({ error: 'Failed to start AI Assistant' }, { status: 500 });
  }
}

// DELETE - Stop AI Assistant monitoring
export async function DELETE() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    eventMonitor.stopMonitoring();

    return NextResponse.json({
      success: true,
      message: 'AI Assistant monitoring stopped',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error stopping AI Assistant:', error);
    return NextResponse.json({ error: 'Failed to stop AI Assistant' }, { status: 500 });
  }
}

// PUT - Resolve or dismiss AI memory
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId, action } = await request.json();

    if (!alertId || !action) {
      return NextResponse.json({ error: 'Missing alertId or action' }, { status: 400 });
    }

    // Record admin action
    await AIMemoryService.recordAdminAction(alertId, {
      type: action.toUpperCase(),
      timestamp: new Date(),
      userId: currentUser.id,
      details: { source: 'api' }
    });

    // If admin acknowledges or resolves, reset reminder count to stop spam
    if (['ACKNOWLEDGED', 'RESOLVED', 'CLICKED', 'VIEWED'].includes(action.toUpperCase())) {
      await AIMemoryService.resetReminderCount(alertId);
      console.log(`🔄 Reset reminders for ${alertId} due to admin ${action}`);
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} marked as ${action}`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating AI memory:', error);
    return NextResponse.json({ error: 'Failed to update AI memory' }, { status: 500 });
  }
}
