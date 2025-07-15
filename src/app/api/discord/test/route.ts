import { NextRequest, NextResponse } from 'next/server';
import { DiscordBotService } from '@/app/libs/discord/discordBotService';

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();
    const botService = DiscordBotService.getInstance();

    if (!botService.isConfigured()) {
      return NextResponse.json({ error: 'Discord bot not configured' }, { status: 500 });
    }

    let result;

    if (type === 'basic') {
      // Basic message test using bot service
      result = await botService.sendBasicTestMessage();
    } else if (type === 'interactive') {
      // Interactive buttons test với unique ID
      const testId = `TEST-${Date.now()}`;
      result = await botService.sendTestMessage(testId);
    } else {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${type} test message sent successfully via Discord Bot`,
      messageId: result.id,
      type: type,
      timestamp: new Date().toISOString(),
      method: 'Discord Bot API'
    });
  } catch (error) {
    console.error('Error sending Discord test:', error);
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
  const configStatus = botService.getConfigStatus();

  return NextResponse.json({
    message: 'Discord Test Endpoint',
    availableTests: ['basic', 'interactive'],
    usage: 'POST with { "type": "basic" | "interactive" }',
    method: 'Discord Bot API',
    configuration: configStatus
  });
}
