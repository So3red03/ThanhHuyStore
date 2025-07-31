import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, note } = await request.json();

    // Validate status
    if (!['RESOLVED', 'DISMISSED', 'ACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update AIMemory status
    const updatedMemory = await prisma.aIMemory.update({
      where: { id: params.id },
      data: {
        status,
        adminActions: JSON.stringify([
          ...JSON.parse(await prisma.aIMemory.findUnique({ where: { id: params.id } }).then(m => m?.adminActions || '[]')),
          {
            action: status,
            adminId: currentUser.id,
            adminName: currentUser.name,
            note: note || '',
            timestamp: new Date().toISOString()
          }
        ])
      }
    });

    // Log admin action
    console.log(`👤 [ADMIN-ACTION] ${currentUser.name} marked ${updatedMemory.alertId} as ${status}${note ? ` - Note: ${note}` : ''}`);

    // If resolved/dismissed, also mark related notifications as read
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      await prisma.notification.updateMany({
        where: {
          message: {
            contains: updatedMemory.productName || ''
          },
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      memory: updatedMemory,
      message: `Alert marked as ${status.toLowerCase()}`
    });

  } catch (error) {
    console.error('Error updating memory status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get memory details with admin actions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memory = await prisma.aIMemory.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            name: true,
            inStock: true,
            price: true
          }
        }
      }
    });

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({
      memory: {
        ...memory,
        adminActions: JSON.parse(memory.adminActions),
        contextData: JSON.parse(memory.contextData)
      }
    });

  } catch (error) {
    console.error('Error fetching memory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
