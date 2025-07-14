import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';
import { sendOrderConfirmationEmail } from '@/app/utils/orderNotifications';
import { webcrypto } from 'crypto';

// Discord interaction types
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
};

const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7
};

// Verify Discord signature using native crypto
async function verifyDiscordRequest(request: NextRequest, body: string): Promise<boolean> {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  console.log('Signature verification:', {
    hasSignature: !!signature,
    hasTimestamp: !!timestamp,
    hasPublicKey: !!publicKey,
    publicKeyLength: publicKey?.length
  });

  if (!signature || !timestamp || !publicKey) {
    console.log('Missing signature components');
    return false;
  }

  try {
    // Convert hex public key to Uint8Array
    const publicKeyBytes = new Uint8Array(publicKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Create the message that was signed (timestamp + body)
    const message = timestamp + body;
    const messageBytes = new TextEncoder().encode(message);

    // Convert hex signature to Uint8Array
    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Import the public key
    const cryptoKey = await webcrypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519'
      },
      false,
      ['verify']
    );

    // Verify the signature
    const isValid = await webcrypto.subtle.verify('Ed25519', cryptoKey, signatureBytes, messageBytes);

    console.log('Signature verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Update Discord message with new content
async function updateDiscordMessage(webhookUrl: string, messageId: string, content: any) {
  try {
    const response = await fetch(`${webhookUrl}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      console.error('Failed to update Discord message:', await response.text());
    }
  } catch (error) {
    console.error('Error updating Discord message:', error);
  }
}

// Create updated embed for approved/rejected orders
function createUpdatedEmbed(originalEmbed: any, status: 'approved' | 'rejected', adminUser: string) {
  const statusConfig = {
    approved: {
      color: 0x00ff00, // Green
      title: '✅ **ĐƠN HÀNG ĐÃ ĐƯỢC DUYỆT**',
      footer: `Đã duyệt bởi ${adminUser} • ThanhHuy Store`
    },
    rejected: {
      color: 0xff0000, // Red
      title: '❌ **ĐƠN HÀNG ĐÃ BỊ HỦY**',
      footer: `Đã hủy bởi ${adminUser} • ThanhHuy Store`
    }
  };

  return {
    ...originalEmbed,
    title: statusConfig[status].title,
    color: statusConfig[status].color,
    footer: {
      text: statusConfig[status].footer
    },
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Log for debugging
    console.log('Discord interaction received:', {
      headers: Object.fromEntries(request.headers.entries()),
      body: body.substring(0, 200) // First 200 chars
    });

    // Verify Discord signature - temporarily disabled for testing
    // const isValidSignature = await verifyDiscordRequest(request, body);
    // if (!isValidSignature) {
    //   console.log('Signature verification failed');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const interaction = JSON.parse(body);
    console.log('Interaction type:', interaction.type);

    // Handle ping
    if (interaction.type === InteractionType.PING) {
      console.log('Responding to PING with PONG');
      return new NextResponse(JSON.stringify({ type: InteractionResponseType.PONG }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle button interactions
    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      const customId = interaction.data.custom_id;
      const [action, orderId] = customId.split('_');

      if (!['approve', 'reject'].includes(action) || !orderId) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '❌ Invalid action or order ID',
            flags: 64 // Ephemeral
          }
        });
      }

      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true }
      });

      if (!order) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '❌ Order not found',
            flags: 64 // Ephemeral
          }
        });
      }

      // Check if order is still pending
      if (order.status !== OrderStatus.pending) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `❌ Order is already ${order.status}`,
            flags: 64 // Ephemeral
          }
        });
      }

      // Get admin user info from Discord
      const adminUser = interaction.member?.nick || interaction.user?.username || 'Unknown Admin';

      // Update order status
      const newStatus = action === 'approve' ? OrderStatus.confirmed : OrderStatus.canceled;

      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus }
      });

      // Log audit trail
      await AuditLogger.log({
        eventType: action === 'approve' ? AuditEventType.ORDER_STATUS_CHANGED : AuditEventType.ORDER_CANCELLED,
        severity: AuditSeverity.MEDIUM,
        userId: 'discord-admin',
        userEmail: `discord:${adminUser}`,
        userRole: 'ADMIN',
        ipAddress: 'discord-webhook',
        userAgent: 'Discord Bot',
        description: `Đơn hàng ${action === 'approve' ? 'được duyệt' : 'bị hủy'} qua Discord bởi ${adminUser}`,
        details: {
          orderId: order.id,
          paymentIntentId: order.paymentIntentId,
          previousStatus: 'pending',
          newStatus: newStatus,
          adminUser: adminUser,
          customerEmail: order.user.email,
          amount: order.amount
        },
        resourceId: order.id,
        resourceType: 'Order'
      });

      // Send email notification to customer
      try {
        const emailContent =
          action === 'approve'
            ? 'Đơn hàng của bạn đã được xác nhận và sẽ được xử lý sớm. '
            : 'Đơn hàng của bạn đã bị hủy. Vui lòng liên hệ với chúng tôi nếu có thắc mắc. ';

        await sendOrderConfirmationEmail(order.user.email, emailContent);
      } catch (error) {
        console.error('Error sending customer email:', error);
      }

      // Update the Discord message
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = createUpdatedEmbed(originalEmbed, action === 'approve' ? 'approved' : 'rejected', adminUser);

      // Respond with updated message (removes buttons)
      return NextResponse.json({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          embeds: [updatedEmbed],
          components: [] // Remove buttons
        }
      });
    }

    return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
  } catch (error) {
    console.error('Discord interaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests (for Discord verification)
export async function GET() {
  return NextResponse.json({ message: 'Discord interactions endpoint' });
}
