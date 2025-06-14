import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import MongoService from '@/app/services/mongoService';
import prisma from '@/app/libs/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = params.fileId;

    // Lấy PDF từ MongoDB
    const { buffer, metadata } = await MongoService.getPDF(fileId);

    if (!buffer) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Kiểm tra quyền truy cập
    if (currentUser.role !== 'ADMIN' && currentUser.id !== metadata.metadata?.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Trả về PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${metadata.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = params.fileId;

    // Xóa PDF từ MongoDB
    await MongoService.deletePDF(fileId);

    return NextResponse.json({
      message: 'PDF deleted successfully',
      fileId,
    });

  } catch (error) {
    console.error('Error deleting PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
