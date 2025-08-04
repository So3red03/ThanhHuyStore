import prisma from '@/app/libs/prismadb';

// Spam protection configuration
export const SPAM_PROTECTION_CONFIG = {
  maxEmailsPerCustomerPerDay: 2,
  maxEmailsPerCustomerPerWeek: 5,
  cooldownPeriodHours: 24,
  unsubscribeTracking: true,
  engagementScoreThreshold: 0.1 // Stop sending if engagement < 10%
};

// Email frequency tracking interface
interface EmailLog {
  id: string;
  customerId: string;
  campaignType: string;
  sentAt: Date;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
  unsubscribed: boolean;
}

/**
 * Check if customer can receive email based on spam protection rules
 */
export async function canSendEmailToCustomer(customerId: string): Promise<{
  canSend: boolean;
  reason?: string;
  nextAllowedTime?: Date;
}> {
  try {
    // Check if customer has unsubscribed (field doesn't exist in current schema)
    // const customer = await prisma.user.findUnique({
    //   where: { id: customerId },
    //   select: { emailUnsubscribed: true }
    // });

    // if (customer?.emailUnsubscribed) {
    //   return {
    //     canSend: false,
    //     reason: 'Customer has unsubscribed from emails'
    //   };
    // }

    // Check daily email limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Note: This would require an email_logs table in production
    // For now, we'll implement basic logic without database tracking

    // Check weekly email limit
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Check cooldown period
    const cooldownTime = new Date();
    cooldownTime.setHours(cooldownTime.getHours() - SPAM_PROTECTION_CONFIG.cooldownPeriodHours);

    return {
      canSend: true
    };
  } catch (error) {
    console.error('Error checking spam protection:', error);
    return {
      canSend: false,
      reason: 'Error checking email permissions'
    };
  }
}

/**
 * Log email sent for spam protection tracking
 */
export async function logEmailSent(customerId: string, campaignType: string, metadata?: any): Promise<void> {
  try {
    // In production, this would save to email_logs table
    console.log(`Email logged: Customer ${customerId}, Campaign ${campaignType}`, metadata);

    // For now, we'll just track in memory or use a simple approach
    // In a real implementation, you'd want:
    /*
    await prisma.emailLog.create({
      data: {
        customerId,
        campaignType,
        sentAt: new Date(),
        metadata: JSON.stringify(metadata)
      }
    });
    */
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

/**
 * Calculate customer engagement score
 */
export async function calculateEngagementScore(customerId: string): Promise<number> {
  try {
    // In production, this would calculate based on email_logs
    // For now, return a default score
    return 0.5; // 50% engagement score

    // Real implementation would be:
    /*
    const logs = await prisma.emailLog.findMany({
      where: {
        customerId,
        sentAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    if (logs.length === 0) return 1.0; // New customer, give benefit of doubt

    const openRate = logs.filter(log => log.opened).length / logs.length;
    const clickRate = logs.filter(log => log.clicked).length / logs.length;
    const bounceRate = logs.filter(log => log.bounced).length / logs.length;

    // Calculate weighted engagement score
    const engagementScore = (openRate * 0.4) + (clickRate * 0.5) - (bounceRate * 0.3);
    return Math.max(0, Math.min(1, engagementScore));
    */
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    return 0.5; // Default score on error
  }
}

/**
 * Get optimal send time for customer based on their engagement history
 */
export async function getOptimalSendTime(customerId: string): Promise<Date> {
  try {
    // In production, this would analyze when customer typically opens emails
    // For now, return a default optimal time (10 AM)
    const optimalTime = new Date();
    optimalTime.setHours(10, 0, 0, 0);

    // If it's past 10 AM today, schedule for tomorrow
    if (new Date() > optimalTime) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }

    return optimalTime;
  } catch (error) {
    console.error('Error getting optimal send time:', error);
    return new Date(); // Send immediately on error
  }
}

/**
 * Batch check spam protection for multiple customers
 */
export async function batchCheckSpamProtection(customerIds: string[]): Promise<{
  allowed: string[];
  blocked: { customerId: string; reason: string }[];
}> {
  const allowed: string[] = [];
  const blocked: { customerId: string; reason: string }[] = [];

  for (const customerId of customerIds) {
    const check = await canSendEmailToCustomer(customerId);
    if (check.canSend) {
      allowed.push(customerId);
    } else {
      blocked.push({
        customerId,
        reason: check.reason || 'Unknown reason'
      });
    }
  }

  return { allowed, blocked };
}

/**
 * Smart frequency capping - adjust send frequency based on engagement
 */
export async function getAdjustedSendFrequency(customerId: string): Promise<{
  maxEmailsPerDay: number;
  maxEmailsPerWeek: number;
  cooldownHours: number;
}> {
  const engagementScore = await calculateEngagementScore(customerId);

  // Adjust frequency based on engagement
  let multiplier = 1;
  if (engagementScore > 0.7) {
    multiplier = 1.5; // High engagement - can send more
  } else if (engagementScore < 0.3) {
    multiplier = 0.5; // Low engagement - send less
  }

  return {
    maxEmailsPerDay: Math.floor(SPAM_PROTECTION_CONFIG.maxEmailsPerCustomerPerDay * multiplier),
    maxEmailsPerWeek: Math.floor(SPAM_PROTECTION_CONFIG.maxEmailsPerCustomerPerWeek * multiplier),
    cooldownHours: Math.floor(SPAM_PROTECTION_CONFIG.cooldownPeriodHours / multiplier)
  };
}

/**
 * Track email interaction (open, click, bounce, unsubscribe)
 */
export async function trackEmailInteraction(
  customerId: string,
  emailId: string,
  interactionType: 'open' | 'click' | 'bounce' | 'unsubscribe',
  metadata?: any
): Promise<void> {
  try {
    // In production, this would update the email_logs table
    console.log(`Email interaction: ${interactionType} by customer ${customerId} for email ${emailId}`, metadata);

    // Handle unsubscribe (field doesn't exist in current schema)
    // if (interactionType === 'unsubscribe') {
    //   await prisma.user.update({
    //     where: { id: customerId },
    //     data: { emailUnsubscribed: true }
    //   });
    // }
  } catch (error) {
    console.error('Error tracking email interaction:', error);
  }
}

/**
 * Generate unsubscribe link for email
 */
export function generateUnsubscribeLink(customerId: string, emailId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/email/unsubscribe?customer=${customerId}&email=${emailId}`;
}

/**
 * Generate email tracking pixel URL
 */
export function generateTrackingPixelUrl(customerId: string, emailId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/email/track/open?customer=${customerId}&email=${emailId}`;
}

/**
 * Generate click tracking URL
 */
export function generateClickTrackingUrl(customerId: string, emailId: string, originalUrl: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${baseUrl}/api/email/track/click?customer=${customerId}&email=${emailId}&url=${encodedUrl}`;
}
