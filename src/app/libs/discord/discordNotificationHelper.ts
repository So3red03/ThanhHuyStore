import prisma from '../prismadb';

/**
 * Helper function to check if Discord notifications are enabled
 */
export const isDiscordNotificationEnabled = async (): Promise<boolean> => {
  try {
    const settings = await prisma.adminSettings.findFirst();

    if (!settings) {
      // Default to true if no settings found (backward compatibility)
      return true;
    }

    // Check both discordNotifications and orderNotifications
    return settings.discordNotifications && settings.orderNotifications;
  } catch (error) {
    console.error('Error checking Discord notification settings:', error);
    // Default to true on error (fail-safe)
    return true;
  }
};

/**
 * Send Discord notification only if enabled in settings
 */
export const sendDiscordNotificationIfEnabled = async (webhookUrl: string, messageData: any): Promise<void> => {
  try {
    // Check if notifications are enabled
    const isEnabled = await isDiscordNotificationEnabled();

    if (!isEnabled) {
      console.log('Discord notifications disabled in settings');
      return;
    }

    if (!webhookUrl) {
      console.log('Discord webhook URL not configured');
      return;
    }

    // Handle both single embed and full message data
    let payload;
    if (messageData.embeds || messageData.components) {
      // Full message data with embeds and components
      payload = messageData;
    } else {
      // Single embed (backward compatibility)
      payload = { embeds: [messageData] };
    }

    console.log('Sending Discord notification:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord webhook failed:', response.status, response.statusText, errorText);
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Discord notification sent successfully');
  } catch (error: any) {
    console.error('Discord webhook error:', error);
    throw error;
  }
};
