import { NextRequest, NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';
import { sendOrderConfirmationEmail } from '@/app/utils/orderNotifications';

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

// Verify Discord signature
function verifyDiscordRequest(request: NextRequest, body: string) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    return false;
  }

  return verifyKey(body, signature, timestamp, publicKey);
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

    // Verify Discord signature
    if (!verifyDiscordRequest(request, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const interaction = JSON.parse(body);

    // Handle ping
    if (interaction.type === InteractionType.PING) {
      return NextResponse.json({ type: InteractionResponseType.PONG });
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
