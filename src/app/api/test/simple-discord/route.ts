import { NextRequest, NextResponse } from 'next/server';
import { DiscordWebhookService } from '../../../libs/discordWebhook';

// Simple test để gửi Discord message
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Discord webhook...');

    const discordService = DiscordWebhookService.getInstance();
    
    // Test simple message
    await discordService.sendSimpleMessage('🧪 Test message from ThanhHuy Store promotion system!');
    
    // Test connection
    const connectionTest = await discordService.testConnection();
    
    return NextResponse.json({
      success: true,
      message: 'Discord test completed',
      data: {
        connectionTest,
        messageSent: true
      }
    });

  } catch (error) {
    console.error('❌ Error testing Discord:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST để test với fake suggestions
export async function POST(request: NextRequest) {
  try {
    const discordService = DiscordWebhookService.getInstance();
    
    // Tạo fake suggestions để test
    const fakeSuggestions = [
      {
        id: 'test-1',
        type: 'STOCK_CLEARANCE' as const,
        priority: 'HIGH' as const,
        title: 'Test Sản phẩm iPhone 16 Pro Max tồn kho cao',
        description: 'Sản phẩm đã tồn kho 5 ngày, chưa có đơn hàng',
        suggestedAction: 'Tạo voucher giảm giá 15%',
        data: {
          productId: '676e14af2a435f5f18b6c2f3',
          productName: 'iPhone 16 Pro Max 1TB',
          currentStock: 18,
          daysWithoutSale: 5,
          suggestedDiscount: 15,
          reasoning: [
            'Tồn kho cao: 18 sản phẩm',
            'Không có đơn hàng trong 30 ngày',
            'Đã tồn kho 5 ngày',
            'Không có chương trình khuyến mãi hiện tại'
          ]
        }
      },
      {
        id: 'test-2',
        type: 'PRODUCT_VOUCHER' as const,
        priority: 'MEDIUM' as const,
        title: 'Test Sản phẩm iPad Pro bán chậm',
        description: 'Chỉ có 0 đơn hàng và giá cao hơn trung bình',
        suggestedAction: 'Tạo voucher thử nghiệm 10%',
        data: {
          productId: '676922ecd04035bd693c1c2f',
          productName: 'iPad Pro 11-inch Wi‑Fi 128GB',
          currentStock: 4,
          suggestedDiscount: 10,
          reasoning: [
            'Ít đơn hàng: 0 đơn trong 30 ngày',
            'Tồn kho: 4 sản phẩm',
            'Có thể cần điều chỉnh giá'
          ]
        }
      }
    ];

    await discordService.sendPromotionSuggestions(fakeSuggestions);
    
    return NextResponse.json({
      success: true,
      message: 'Fake suggestions sent to Discord',
      data: {
        suggestions: fakeSuggestions,
        count: fakeSuggestions.length
      }
    });

  } catch (error) {
    console.error('❌ Error sending fake suggestions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
