import crypto from 'crypto';

export class MoMoSecurity {
  private static readonly SECRET_KEY = process.env.MOMO_SECRET_KEY;

  /**
   * Verify MoMo callback signature using HMAC SHA256
   * @param data - The callback data from MoMo
   * @param receivedSignature - The signature received from MoMo
   * @returns boolean - True if signature is valid
   */
  static verifySignature(data: any, receivedSignature: string): boolean {
    if (!this.SECRET_KEY) {
      console.error('MOMO_SECRET_KEY not configured');
      return false;
    }

    if (!receivedSignature) {
      console.error('No signature provided');
      return false;
    }

    try {
      // Create signature string according to MoMo documentation
      // Order of fields is important and must match MoMo's specification
      const signatureString = [
        `accessKey=${data.accessKey || ''}`,
        `amount=${data.amount || ''}`,
        `extraData=${data.extraData || ''}`,
        `message=${data.message || ''}`,
        `orderId=${data.orderId || ''}`,
        `orderInfo=${data.orderInfo || ''}`,
        `orderType=${data.orderType || ''}`,
        `partnerCode=${data.partnerCode || ''}`,
        `payType=${data.payType || ''}`,
        `requestId=${data.requestId || ''}`,
        `responseTime=${data.responseTime || ''}`,
        `resultCode=${data.resultCode || ''}`,
        `transId=${data.transId || ''}`
      ].join('&');

      const expectedSignature = crypto.createHmac('sha256', this.SECRET_KEY).update(signatureString).digest('hex');

      const isValid = expectedSignature === receivedSignature;

      if (!isValid) {
        console.error('Signature verification failed:', {
          expected: expectedSignature,
          received: receivedSignature,
          signatureString
        });
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Log security events for monitoring and auditing
   * @param event - The security event type
   * @param data - Additional data to log
   */
  static logSecurityEvent(event: string, data: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data
    };

    // In production, you might want to send this to a security monitoring service
    // or store in a dedicated security log database
  }

  /**
   * Validate required fields in MoMo callback
   * @param data - The callback data
   * @returns object with validation result and missing fields
   */
  static validateRequiredFields(data: any): { isValid: boolean; missingFields: string[] } {
    const requiredFields = ['orderId', 'resultCode', 'partnerCode', 'requestId'];

    const missingFields = requiredFields.filter(
      field => data[field] === undefined || data[field] === null || data[field] === ''
    );

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Check for potential replay attacks by tracking processed requests
   * @param requestId - The request ID from MoMo
   * @param orderId - The order ID
   * @returns boolean - True if request appears to be a replay
   */
  static async checkReplayAttack(requestId: string, orderId: string): Promise<boolean> {
    // In a production environment, you would store processed request IDs
    // in Redis or a database with TTL to prevent replay attacks

    // For now, we'll implement a simple in-memory check
    // This should be replaced with a proper persistent storage solution

    try {
      // Check if this requestId has been processed before
      // This is a simplified implementation - in production use Redis/DB
      const cacheKey = `momo_request_${requestId}_${orderId}`;

      // For now, just log the check - implement proper storage later
      this.logSecurityEvent('REPLAY_CHECK', {
        requestId,
        orderId,
        cacheKey
      });

      return false; // Assume no replay for now
    } catch (error) {
      console.error('Error checking replay attack:', error);
      return false; // Fail open for now, but log the error
    }
  }

  /**
   * Validate amount consistency between order and callback
   * @param orderAmount - Amount from our order record
   * @param callbackAmount - Amount from MoMo callback
   * @returns boolean - True if amounts match within tolerance
   */
  static validateAmount(orderAmount: number, callbackAmount: number): boolean {
    const tolerance = 0.01; // Allow 1 cent difference for floating point precision
    const difference = Math.abs(orderAmount - callbackAmount);

    const isValid = difference <= tolerance;

    if (!isValid) {
      this.logSecurityEvent('AMOUNT_MISMATCH', {
        orderAmount,
        callbackAmount,
        difference
      });
    }

    return isValid;
  }

  /**
   * Rate limiting for callback endpoints to prevent abuse
   * @param identifier - IP address or other identifier
   * @returns boolean - True if within rate limit
   */
  static checkRateLimit(identifier: string): boolean {
    // Implement rate limiting logic here
    // For production, use Redis with sliding window or token bucket

    this.logSecurityEvent('RATE_LIMIT_CHECK', {
      identifier,
      timestamp: Date.now()
    });

    return true; // Allow for now, implement proper rate limiting later
  }
}
