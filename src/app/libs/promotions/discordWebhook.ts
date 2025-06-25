import { PromotionSuggestion } from './promotionSuggestionEngine';

const DISCORD_ORDER_WEBHOOK_URL = process.env.PROMOTION_DISCORD_WEBHOOK || '';

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

export class DiscordWebhookService {
  private static instance: DiscordWebhookService;

  public static getInstance(): DiscordWebhookService {
    if (!DiscordWebhookService.instance) {
      DiscordWebhookService.instance = new DiscordWebhookService();
    }
    return DiscordWebhookService.instance;
  }

  // Gửi thông báo gợi ý khuyến mãi
  public async sendPromotionSuggestions(suggestions: PromotionSuggestion[]): Promise<void> {
    if (suggestions.length === 0) return;

    try {
      const embeds = this.createPromotionEmbeds(suggestions);

      await fetch(DISCORD_ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'ThanhHuy Store - Promotion Bot',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          content: `🎯 **GỢI Ý KHUYẾN MÃI TỰ ĐỘNG** - Phát hiện ${suggestions.length} cơ hội tối ưu tồn kho`,
          embeds: embeds
        })
      });

      console.log(`✅ Sent ${suggestions.length} promotion suggestions to Discord`);
    } catch (error) {
      console.error('❌ Error sending Discord notification:', error);
    }
  }

  // Tạo Discord embeds cho gợi ý
  private createPromotionEmbeds(suggestions: PromotionSuggestion[]): DiscordEmbed[] {
    const embeds: DiscordEmbed[] = [];

    // Nhóm suggestions theo priority
    const highPriority = suggestions.filter(s => s.priority === 'HIGH');
    const mediumPriority = suggestions.filter(s => s.priority === 'MEDIUM');
    const lowPriority = suggestions.filter(s => s.priority === 'LOW');

    // Tạo summary embed
    embeds.push({
      title: '📊 TỔNG QUAN GỢI Ý KHUYẾN MÃI',
      description: 'Hệ thống đã phân tích và phát hiện các cơ hội tối ưu kinh doanh',
      color: 0x3498db, // Blue
      fields: [
        {
          name: '🔴 Ưu tiên cao',
          value: `${highPriority.length} gợi ý`,
          inline: true
        },
        {
          name: '🟡 Ưu tiên trung bình',
          value: `${mediumPriority.length} gợi ý`,
          inline: true
        },
        {
          name: '🟢 Ưu tiên thấp',
          value: `${lowPriority.length} gợi ý`,
          inline: true
        }
      ],
      footer: {
        text: 'ThanhHuy Store - Promotion Intelligence System'
      },
      timestamp: new Date().toISOString()
    });

    // Tạo embeds cho từng suggestion (chỉ top 5 để tránh spam)
    const topSuggestions = suggestions.slice(0, 5);

    for (const suggestion of topSuggestions) {
      const color = this.getPriorityColor(suggestion.priority);
      const icon = this.getTypeIcon(suggestion.type);

      embeds.push({
        title: `${icon} ${suggestion.title}`,
        description: suggestion.description,
        color: color,
        fields: [
          {
            name: '💡 Hành động đề xuất',
            value: suggestion.suggestedAction,
            inline: false
          },
          {
            name: '📊 Chi tiết',
            value: this.formatSuggestionDetails(suggestion),
            inline: false
          },
          {
            name: '🔍 Lý do phân tích',
            value: suggestion.data.reasoning.map(r => `• ${r}`).join('\n'),
            inline: false
          }
        ],
        footer: {
          text: `Độ ưu tiên: ${suggestion.priority} | Loại: ${suggestion.type}`
        }
      });
    }

    // Nếu có nhiều hơn 5 suggestions, thêm thông báo
    if (suggestions.length > 5) {
      embeds.push({
        title: '📋 THÔNG TIN THÊM',
        description: `Còn ${suggestions.length - 5} gợi ý khác. Vui lòng kiểm tra admin dashboard để xem chi tiết.`,
        color: 0x95a5a6, // Gray
        fields: [],
        footer: {
          text: 'Truy cập admin panel để xem tất cả gợi ý'
        }
      });
    }

    return embeds;
  }

  // Format chi tiết suggestion
  private formatSuggestionDetails(suggestion: PromotionSuggestion): string {
    const details: string[] = [];

    if (suggestion.data.productName) {
      details.push(`**Sản phẩm:** ${suggestion.data.productName}`);
    }

    if (suggestion.data.categoryName) {
      details.push(`**Danh mục:** ${suggestion.data.categoryName}`);
    }

    if (suggestion.data.currentStock) {
      details.push(`**Tồn kho:** ${suggestion.data.currentStock} sản phẩm`);
    }

    if (suggestion.data.daysWithoutSale) {
      details.push(`**Ngày không bán:** ${suggestion.data.daysWithoutSale} ngày`);
    }

    if (suggestion.data.viewCount) {
      details.push(`**Lượt xem:** ${suggestion.data.viewCount} lượt`);
    }

    if (suggestion.data.suggestedDiscount) {
      details.push(`**Giảm giá đề xuất:** ${suggestion.data.suggestedDiscount}%`);
    }

    return details.join('\n') || 'Không có chi tiết';
  }

  // Lấy màu theo priority
  private getPriorityColor(priority: string): number {
    switch (priority) {
      case 'HIGH':
        return 0xe74c3c; // Red
      case 'MEDIUM':
        return 0xf39c12; // Orange
      case 'LOW':
        return 0x2ecc71; // Green
      default:
        return 0x95a5a6; // Gray
    }
  }

  // Lấy icon theo type
  private getTypeIcon(type: string): string {
    switch (type) {
      case 'PRODUCT_VOUCHER':
        return '🎫';
      case 'CATEGORY_PROMOTION':
        return '🏷️';
      case 'STOCK_CLEARANCE':
        return '📦';
      default:
        return '💡';
    }
  }

  // Gửi thông báo đơn giản
  public async sendSimpleMessage(message: string, isError: boolean = false): Promise<void> {
    try {
      await fetch(DISCORD_ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'ThanhHuy Store - System',
          content: `${isError ? '❌' : '✅'} ${message}`
        })
      });
    } catch (error) {
      console.error('Error sending Discord message:', error);
    }
  }

  // Test webhook connection
  public async testConnection(): Promise<boolean> {
    try {
      await this.sendSimpleMessage('🧪 Test connection - Promotion suggestion system is online!');
      return true;
    } catch (error) {
      console.error('Discord webhook test failed:', error);
      return false;
    }
  }
}
