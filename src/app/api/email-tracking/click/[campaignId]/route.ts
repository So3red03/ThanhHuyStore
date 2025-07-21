import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect');
    
    if (!redirectUrl) {
      return NextResponse.json({ error: 'Redirect URL is required' }, { status: 400 });
    }
    
    const { campaignId } = params;
    
    // Increment click count for the campaign
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        clickCount: {
          increment: 1
        }
      }
    });
    
    console.log(`📊 Email click tracked for campaign: ${campaignId}`);
    
    // Redirect to the actual product page
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Error tracking email click:', error);
    
    // Even if tracking fails, still redirect to the product page
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect');
    
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }
    
    // Fallback to homepage if no redirect URL
    return NextResponse.redirect(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  }
}
