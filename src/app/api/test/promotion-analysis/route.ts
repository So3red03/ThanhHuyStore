import { NextRequest, NextResponse } from 'next/server';
import { PromotionSuggestionEngine } from '../../../libs/promotionSuggestionEngine';
import { DiscordWebhookService } from '../../../libs/discordWebhook';

// Test endpoint để chạy promotion analysis manual
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting manual promotion analysis test...');

    // Chạy phân tích
    const engine = PromotionSuggestionEngine.getInstance();
    const suggestions = await engine.generateSuggestions();

    console.log(`📊 Found ${suggestions.length} suggestions:`, suggestions);

    if (suggestions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No promotion suggestions found',
        data: {
          suggestions: [],
          count: 0,
          discordSent: false
        }
      });
    }

    // Test Discord webhook
    const discordService = DiscordWebhookService.getInstance();
    
    // Test connection first
    console.log('🔗 Testing Discord connection...');
    const connectionTest = await discordService.testConnection();
    console.log(`Discord connection test: ${connectionTest ? '✅ Success' : '❌ Failed'}`);

    // Send suggestions to Discord
    console.log('📤 Sending suggestions to Discord...');
    await discordService.sendPromotionSuggestions(suggestions);
    console.log('✅ Suggestions sent to Discord successfully');

    return NextResponse.json({
      success: true,
      message: `Found ${suggestions.length} promotion suggestions and sent to Discord`,
      data: {
        suggestions,
        count: suggestions.length,
        discordSent: true,
        connectionTest
      }
    });

  } catch (error) {
    console.error('❌ Error in test promotion analysis:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Test promotion analysis failed'
    }, { status: 500 });
  }
}

// POST endpoint để test với custom parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testDiscordOnly = false, sendToDiscord = true } = body;

    if (testDiscordOnly) {
      // Chỉ test Discord webhook
      const discordService = DiscordWebhookService.getInstance();
      const success = await discordService.testConnection();
      
      return NextResponse.json({
        success,
        message: success 
          ? 'Discord webhook test successful' 
          : 'Discord webhook test failed',
        data: { connectionTest: success }
      });
    }

    // Chạy full analysis
    const engine = PromotionSuggestionEngine.getInstance();
    const suggestions = await engine.generateSuggestions();

    let discordSent = false;
    if (sendToDiscord && suggestions.length > 0) {
      const discordService = DiscordWebhookService.getInstance();
      await discordService.sendPromotionSuggestions(suggestions);
      discordSent = true;
    }

    return NextResponse.json({
      success: true,
      message: `Analysis complete. Found ${suggestions.length} suggestions.`,
      data: {
        suggestions,
        count: suggestions.length,
        discordSent
      }
    });

  } catch (error) {
    console.error('Error in POST test promotion analysis:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
