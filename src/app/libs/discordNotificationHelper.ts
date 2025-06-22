import prisma from './prismadb';

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
export const sendDiscordNotificationIfEnabled = async (
  webhookUrl: string,
  embed: any
): Promise<void> => {
  try {
    // Check if notifications are enabled
    const isEnabled = await isDiscordNotificationEnabled();
    
    if (!isEnabled) {
      console.log('Discord notifications are disabled in settings');
      return;
    }
    
    if (!webhookUrl) {
      console.error('Discord webhook URL not configured');
      return;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });
    
    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, response.statusText);
    } else {
      console.log('Discord notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
};
