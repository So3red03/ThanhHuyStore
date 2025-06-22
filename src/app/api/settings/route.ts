import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

// GET: Lấy public settings (chỉ payment methods cho checkout)
export async function GET(request: NextRequest) {
  try {
    // Lấy settings từ database
    const settings = await prisma.adminSettings.findFirst();

    if (!settings) {
      // Fallback to safe defaults nếu chưa có settings
      return NextResponse.json({
        settings: {
          codPayment: true,
          momoPayment: false,
          stripePayment: false
        },
        success: true
      });
    }

    // Chỉ trả về payment settings cho public endpoint (security)
    const publicSettings = {
      codPayment: settings.codPayment,
      momoPayment: settings.momoPayment,
      stripePayment: settings.stripePayment
    };

    return NextResponse.json({
      settings: publicSettings,
      success: true
    });
  } catch (error) {
    console.error('Get public settings error:', error);

    // Fallback to safe defaults on error
    return NextResponse.json({
      settings: {
        codPayment: true,
        momoPayment: false,
        stripePayment: false
      },
      success: true
    });
  }
}
