import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

// TODO: GET: Lấy danh sách sản phẩm đã xóa (soft delete) - implement after database update
export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  try {
    // Temporary: return empty array until soft delete is implemented
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching deleted products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
