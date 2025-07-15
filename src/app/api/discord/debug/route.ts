import { NextRequest, NextResponse } from 'next/server';
import { DiscordBotService } from '@/app/libs/discord/discordBotService';

export async function POST(request: NextRequest) {
  try {
    const botService = DiscordBotService.getInstance();

    if (!botService.isConfigured()) {
      return NextResponse.json({ error: 'Discord bot not configured' }, { status: 500 });
    }

    // Test message with buttons
    const testMessage = {
      embeds: [
        {
          title: '🛒 **ĐỚN HÀNG MỚI #6875158c854cfbac055c991b**',
          description: 'Đơn hàng mới cần được xử lý',
          color: 0x00ff00,
          fields: [
            {
              name: '👤 **Thông tin khách hàng**',
              value: 'Tên: admin\nEmail: admin@gmail.com\nSĐT: +84707887106',
              inline: false
            },
            {
              name: '📍 **Địa chỉ giao hàng**',
              value: '633/23 Điện biên phủ, Xã Đức Lĩnh, Huyện Vũ Quang, Tỉnh Hà Tĩnh, Việt Nam',
              inline: false
            },
            {
              name: '🛍️ **Sản phẩm đặt mua**',
              value: '1. **iPhone 16 Pro Max** - Số lượng: 1 - Giá: 30.390.000₫',
              inline: false
            },
            {
              name: '💰 **Thông tin thanh toán**',
              value:
                '**Tổng tiền hàng:** 30.390.000₫\n**Phí ship:** 40.000₫\n**Giảm giá:** 0₫\n**Tổng thanh toán:** 30.430.000₫\n**Phương thức:** COD',
              inline: false
            }
          ],
          footer: {
            text: 'ThanhHuy Store - Đơn hàng mới • ' + new Date().toLocaleString('vi-VN')
          },
          timestamp: new Date().toISOString()
        }
      ],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 3, // Success (Green)
              label: 'CONFIRM',
              custom_id: 'approve_6875158c854cfbac055c991b'
            },
            {
              type: 2, // Button
              style: 4, // Danger (Red)
              label: 'CANCEL',
              custom_id: 'reject_6875158c854cfbac055c991b'
            }
          ]
        }
      ]
    };

    console.log('Sending production test message via Bot API:', JSON.stringify(testMessage, null, 2));

    const result = await botService.sendMessage(testMessage);

    return NextResponse.json({
      success: true,
      message: 'Production test message sent successfully via Discord Bot API',
      messageId: result.id,
      method: 'Discord Bot API',
      realOrderId: '6875158c854cfbac055c991b',
      customIds: ['approve_6875158c854cfbac055c991b', 'reject_6875158c854cfbac055c991b'],
      interactionEndpoint: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/discord/interactions`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending production test:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const botService = DiscordBotService.getInstance();

  return NextResponse.json({
    message: 'Discord Production Debug Endpoint',
    status: 'ready',
    method: 'Discord Bot API',
    configuration: botService.getConfigStatus(),
    environment: {
      hasWebhookUrl: !!process.env.DISCORD_ORDER_WEBHOOK_URL,
      hasPublicKey: !!process.env.DISCORD_PUBLIC_KEY,
      hasBotToken: !!process.env.DISCORD_BOT_TOKEN,
      hasChannelId: !!process.env.DISCORD_CHANNEL_ID,
      publicKeyLength: process.env.DISCORD_PUBLIC_KEY?.length,
      channelId: process.env.DISCORD_CHANNEL_ID
    },
    endpoints: {
      interactions: '/api/discord/interactions',
      debug: '/api/discord/debug',
      test: '/api/discord/test'
    },
    instructions: {
      setup:
        'Make sure Discord Application Interaction Endpoint URL is set to: https://yourdomain.com/api/discord/interactions',
      test: 'POST to this endpoint to send a test message with working buttons'
    }
  });
}
