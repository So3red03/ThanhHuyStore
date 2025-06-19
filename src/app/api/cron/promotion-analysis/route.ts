import { NextRequest, NextResponse } from 'next/server';
import { PromotionSuggestionEngine } from '../../../libs/promotionSuggestionEngine';
import { DiscordWebhookService } from '../../../libs/discordWebhook';
import prisma from '../../../libs/prismadb';

// Cron job để chạy phân tích khuyến mãi tự động
export async function GET(request: NextRequest) {
  try {
    // Kiểm tra authorization header (để bảo mật cron job)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting automated promotion analysis...');

    // Chạy phân tích
    const engine = PromotionSuggestionEngine.getInstance();
    const suggestions = await engine.generateSuggestions();

    if (suggestions.length === 0) {
      console.log('✅ No promotion suggestions found');
      return NextResponse.json({
        success: true,
        message: 'No suggestions found',
        count: 0
      });
    }

    // Lưu notifications vào database
    const notifications: any[] = [];
    for (const suggestion of suggestions) {
      // Kiểm tra xem đã có notification tương tự chưa (trong 24h)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'PROMOTION_SUGGESTION',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
          },
          // Check if notification data contains the same productId
          AND: [
            {
              data: {
                not: null
              }
            }
          ]
        }
      });

      // Chỉ tạo notification mới nếu chưa có (simplified check)
      if (!existingNotification && suggestion.data.productId) {
        const notification = await prisma.notification.create({
          data: {
            type: 'PROMOTION_SUGGESTION',
            title: suggestion.title,
            message: suggestion.description,
            data: {
              suggestionId: suggestion.id,
              type: suggestion.type,
              priority: suggestion.priority,
              suggestedAction: suggestion.suggestedAction,
              productId: suggestion.data.productId,
              categoryId: suggestion.data.categoryId,
              suggestedDiscount: suggestion.data.suggestedDiscount,
              reasoning: suggestion.data.reasoning,
              automated: true,
              timestamp: new Date().toISOString()
            }
          }
        });
        notifications.push(notification);
      }
    }

    // Chỉ gửi Discord nếu có notifications mới
    if (notifications.length > 0) {
      const discordService = DiscordWebhookService.getInstance();

      // Filter suggestions để chỉ gửi những cái mới
      const newSuggestions = suggestions.filter(s =>
        notifications.some(
          (n: any) =>
            n.data && typeof n.data === 'object' && 'productId' in n.data && n.data.productId === s.data.productId
        )
      );

      await discordService.sendPromotionSuggestions(newSuggestions);

      console.log(`✅ Sent ${newSuggestions.length} new promotion suggestions to Discord`);
    }

    // Log kết quả
    console.log(
      `✅ Promotion analysis completed: ${suggestions.length} total suggestions, ${notifications.length} new notifications`
    );

    return NextResponse.json({
      success: true,
      message: 'Promotion analysis completed',
      data: {
        totalSuggestions: suggestions.length,
        newNotifications: notifications.length,
        discordSent: notifications.length > 0
      }
    });
  } catch (error) {
    console.error('❌ Error in promotion analysis cron job:', error);

    // Gửi thông báo lỗi qua Discord
    try {
      const discordService = DiscordWebhookService.getInstance();
      await discordService.sendSimpleMessage(`Lỗi trong quá trình phân tích khuyến mãi tự động: ${error}`, true);
    } catch (discordError) {
      console.error('Failed to send error notification to Discord:', discordError);
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Manual trigger (cho admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminToken } = body;

    // Kiểm tra admin token
    if (adminToken !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chạy phân tích manual
    const engine = PromotionSuggestionEngine.getInstance();
    const suggestions = await engine.generateSuggestions();

    // Gửi Discord ngay lập tức
    if (suggestions.length > 0) {
      const discordService = DiscordWebhookService.getInstance();
      await discordService.sendPromotionSuggestions(suggestions);
    }

    return NextResponse.json({
      success: true,
      message: 'Manual promotion analysis completed',
      data: {
        suggestions: suggestions.length,
        discordSent: suggestions.length > 0
      }
    });
  } catch (error) {
    console.error('Error in manual promotion analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
