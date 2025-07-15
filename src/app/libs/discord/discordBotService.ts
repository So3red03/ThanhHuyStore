/**
 * Discord Bot Service
 * Handles sending messages via Discord Bot API instead of webhooks
 * This allows for interactive components like buttons
 */

export class DiscordBotService {
  private static instance: DiscordBotService;
  private botToken: string;
  private channelId: string;

  private constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN!;
    this.channelId = process.env.DISCORD_CHANNEL_ID!;
  }

  public static getInstance(): DiscordBotService {
    if (!DiscordBotService.instance) {
      DiscordBotService.instance = new DiscordBotService();
    }
    return DiscordBotService.instance;
  }

  /**
   * Send message via Discord Bot API
   * This allows for interactive components like buttons
   */
  public async sendMessage(messageData: any): Promise<any> {
    if (!this.botToken || !this.channelId) {
      throw new Error('Discord bot token or channel ID not configured');
    }

    try {
      console.log('Sending message via Discord Bot API:', JSON.stringify(messageData, null, 2));

      const response = await fetch(`https://discord.com/api/v10/channels/${this.channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discord Bot API error:', response.status, response.statusText, errorText);
        throw new Error(`Discord Bot API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Discord message sent successfully via Bot API:', result.id);
      return result;

    } catch (error) {
      console.error('Discord Bot Service error:', error);
      throw error;
    }
  }

  /**
   * Send test message with interactive buttons
   */
  public async sendTestMessage(testId: string): Promise<any> {
    const messageData = {
      embeds: [{
        title: '🧪 **Discord Button Test**',
        description: 'Test message với interactive buttons\n\n⚠️ **Lưu ý:** Buttons này sẽ hoạt động và gửi response về Discord!',
        color: 0x0099ff,
        fields: [
          {
            name: '📋 **Test Order**',
            value: `Order ID: \`${testId}\`\nAmount: \`1.000.000 VND\`\nCustomer: \`Test User\``,
            inline: false
          },
          {
            name: '🎮 **Hướng dẫn Test**',
            value: '1. Click **CONFIRM** hoặc **CANCEL**\n2. Bot sẽ response với message xác nhận\n3. Buttons sẽ bị disable sau khi click',
            inline: false
          }
        ],
        footer: {
          text: 'ThanhHuy Store - Button Test • ' + new Date().toLocaleString('vi-VN')
        },
        timestamp: new Date().toISOString()
      }],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 3, // Success (Green)
              label: 'CONFIRM',
              custom_id: `test_approve_${testId}`
            },
            {
              type: 2, // Button
              style: 4, // Danger (Red)
              label: 'CANCEL',
              custom_id: `test_reject_${testId}`
            }
          ]
        }
      ]
    };

    return this.sendMessage(messageData);
  }

  /**
   * Send basic test message without buttons
   */
  public async sendBasicTestMessage(): Promise<any> {
    const messageData = {
      content: '🧪 **Basic Discord Test**',
      embeds: [{
        title: '✅ Basic Bot Test',
        description: 'This is a basic Discord bot test message',
        color: 0x00ff00,
        footer: {
          text: 'ThanhHuy Store - Test • ' + new Date().toLocaleString('vi-VN')
        },
        timestamp: new Date().toISOString()
      }]
    };

    return this.sendMessage(messageData);
  }

  /**
   * Check if bot is properly configured
   */
  public isConfigured(): boolean {
    return !!(this.botToken && this.channelId);
  }

  /**
   * Get bot configuration status
   */
  public getConfigStatus() {
    return {
      hasBotToken: !!this.botToken,
      hasChannelId: !!this.channelId,
      isConfigured: this.isConfigured()
    };
  }
}
