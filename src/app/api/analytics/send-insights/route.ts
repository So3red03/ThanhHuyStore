import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { NextResponse } from 'next/server';
import { AnalyticsInsightService } from '@/app/libs/analytics/analyticsInsightService';
import { DiscordWebhookService } from '@/app/libs/promotions/discordWebhook';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { days = 7 } = body;

    // Validate days parameter
    if (typeof days !== 'number' || days < 1 || days > 90) {
      return NextResponse.json({ error: 'Invalid days parameter. Must be between 1 and 90.' }, { status: 400 });
    }

    // Generate analytics insights
    const insights = await AnalyticsInsightService.generateInsightReport(days);

    // Create Discord embeds for insights
    const embeds = [];

    // Summary embed
    embeds.push({
      title: 'PHÂN TÍCH & ĐỀ XUẤT',
      description: `Phân tích dữ liệu ${insights.period} - ThanhHuy Store`,
      color: 0x3b82f6,
      fields: [
        {
          name: '🎯 Sản phẩm đề xuất',
          value: `${insights.summary.totalRecommendations} sản phẩm`,
          inline: true
        },
        {
          name: '🎁 Khuyến mãi đề xuất',
          value: `${insights.summary.totalPromotions} chiến dịch`,
          inline: true
        },
        {
          name: '📈 Tỷ lệ chuyển đổi',
          value: `${insights.summary.conversionRate}%`,
          inline: true
        }
      ],
      footer: {
        text: 'ThanhHuy Store - Analytics Intelligence'
      },
      timestamp: new Date().toISOString()
    });

    // Product recommendations embed - dynamic title based on data
    if (insights.productRecommendations.length > 0) {
      const topProduct = insights.productRecommendations[0];
      const dynamicTitle =
        topProduct.viewCount > 50
          ? '🔥 SẢN PHẨM TRENDING NHẤT'
          : topProduct.viewCount > 20
          ? '📈 SẢN PHẨM ĐƯỢC QUAN TÂM'
          : '👀 SẢN PHẨM CÓ TIỀM NĂNG';

      embeds.push({
        title: dynamicTitle,
        description: `Top ${insights.productRecommendations.length} sản phẩm dựa trên ${insights.period}`,
        color: 0x22c55e,
        fields: insights.productRecommendations.slice(0, 5).map((product, index) => ({
          name: `${index + 1}. ${product.productName}`,
          value: `📂 ${product.category}\n👁️ ${product.viewCount} lượt xem\n💡 ${product.reason}`,
          inline: false
        }))
      });
    }

    // Promotion suggestions embed
    if (insights.promotionSuggestions.length > 0) {
      embeds.push({
        title: '🎁 ĐỀ XUẤT KHUYẾN MÃI',
        description: 'Chiến dịch khuyến mãi dựa trên tồn kho và hành vi',
        color: 0xf59e0b,
        fields: insights.promotionSuggestions.map((suggestion, index) => ({
          name: `${index + 1}. ${suggestion.title}`,
          value: `🔥 Độ ưu tiên: ${suggestion.priority.toUpperCase()}\n📝 ${suggestion.description}\n🛍️ ${
            suggestion.productIds.length
          } sản phẩm`,
          inline: false
        }))
      });
    }

    // Related products embed - dynamic title based on patterns
    // if (insights.relatedProducts.length > 0) {
    //   const strongestPattern = insights.relatedProducts[0];
    //   const dynamicTitle =
    //     strongestPattern.frequency > 10
    //       ? '🔥 COMBO SẢN PHẨM PHỔ BIẾN'
    //       : strongestPattern.frequency > 5
    //       ? '🔗 SẢN PHẨM THƯỜNG MUA CÙNG'
    //       : '💡 GỢI Ý SẢN PHẨM LIÊN QUAN';

    //   embeds.push({
    //     title: dynamicTitle,
    //     description: `${insights.relatedProducts.length} patterns được phát hiện từ hành vi người dùng`,
    //     color: 0x8b5cf6,
    //     fields: insights.relatedProducts.slice(0, 5).map((pattern, index) => ({
    //       name: `Pattern ${index + 1} (${pattern.frequency} lần)`,
    //       value: `💡 ${pattern.suggestion}`,
    //       inline: true
    //     }))
    //   });
    // }

    // User behavior embed
    embeds.push({
      title: '👥 PHÂN TÍCH HÀNH VI NGƯỜI DÙNG',
      description: 'Tổng quan hoạt động và xu hướng',
      color: 0x06b6d4,
      fields: [
        {
          name: '👤 Tổng người dùng',
          value: insights.userBehavior.totalUsers.toString(),
          inline: true
        },
        {
          name: '🔥 Người dùng hoạt động',
          value: insights.userBehavior.activeUsers.toString(),
          inline: true
        },
        {
          name: '📊 Tỷ lệ hoạt động',
          value: `${Math.round((insights.userBehavior.activeUsers / insights.userBehavior.totalUsers) * 100)}%`,
          inline: true
        }
      ]
    });

    // Send to Discord using existing webhook service
    const discordService = DiscordWebhookService.getInstance();

    // Send as a custom message with embeds
    const webhookUrl = process.env.PROMOTION_DISCORD_WEBHOOK || '';
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Discord webhook not configured' }, { status: 500 });
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'ThanhHuy Store - Analytics Bot',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
        content: `**BÁO CÁO PHÂN TÍCH** - ${insights.period}`,
        embeds: embeds
      })
    });

    return NextResponse.json({
      success: true,
      message: `Analytics insights sent to Discord for ${insights.period}`,
      data: {
        totalEmbeds: embeds.length,
        insights: insights.summary
      }
    });
  } catch (error: any) {
    console.error('Error sending analytics insights:', error);

    return NextResponse.json(
      {
        error: 'Internal server error while sending analytics insights'
      },
      { status: 500 }
    );
  }
}
