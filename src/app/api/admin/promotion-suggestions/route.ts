import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../actions/getCurrentUser';
import { PromotionSuggestionEngine } from '../../../libs/promotionSuggestionEngine';
import { DiscordWebhookService } from '../../../libs/discordWebhook';
import prisma from '../../../libs/prismadb';

// GET: Lấy danh sách gợi ý khuyến mãi
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Kiểm tra quyền admin
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = PromotionSuggestionEngine.getInstance();
    const suggestions = await engine.generateSuggestions();

    return NextResponse.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting promotion suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Chạy phân tích và gửi thông báo Discord
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Kiểm tra quyền admin
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sendDiscord = true } = body;

    if (action === 'analyze') {
      // Chạy phân tích
      const engine = PromotionSuggestionEngine.getInstance();
      const suggestions = await engine.generateSuggestions();

      // Lưu notifications vào database
      const notifications = [];
      for (const suggestion of suggestions) {
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
              reasoning: suggestion.data.reasoning
            }
          }
        });
        notifications.push(notification);
      }

      // Gửi Discord notification nếu được yêu cầu
      if (sendDiscord && suggestions.length > 0) {
        const discordService = DiscordWebhookService.getInstance();
        await discordService.sendPromotionSuggestions(suggestions);
      }

      return NextResponse.json({
        success: true,
        message: `Phân tích hoàn thành. Tìm thấy ${suggestions.length} gợi ý khuyến mãi.`,
        data: {
          suggestions,
          notifications: notifications.length,
          discordSent: sendDiscord && suggestions.length > 0
        }
      });
    } else if (action === 'test-discord') {
      // Test Discord webhook
      const discordService = DiscordWebhookService.getInstance();
      const success = await discordService.testConnection();

      return NextResponse.json({
        success,
        message: success ? 'Discord webhook hoạt động bình thường' : 'Không thể kết nối Discord webhook'
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing promotion suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
