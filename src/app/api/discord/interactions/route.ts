import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';
import { sendOrderConfirmationEmail } from '@/app/utils/orderNotifications';
import { DiscordBotService } from '@/app/libs/discord/discordBotService';
import nacl from 'tweetnacl';

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

// Verify Discord signature using tweetnacl
function verifyDiscordRequest(request: NextRequest, body: string): boolean {
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
    // Convert hex strings to Uint8Array
    const publicKeyBytes = new Uint8Array(publicKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Create the message that was signed (timestamp + body)
    const message = timestamp + body;
    const messageBytes = new TextEncoder().encode(message);

    // Verify signature using tweetnacl
    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

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
function createUpdatedEmbed(
  originalEmbed: any,
  status: 'approved' | 'rejected',
  adminUser: string,
  cancelReason?: string
) {
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

  const updatedEmbed = {
    ...originalEmbed,
    title: statusConfig[status].title,
    color: statusConfig[status].color,
    footer: {
      text: statusConfig[status].footer
    },
    timestamp: new Date().toISOString()
  };

  // Add cancel reason field if order was rejected
  if (status === 'rejected' && cancelReason) {
    updatedEmbed.fields = [
      ...originalEmbed.fields,
      {
        name: '❌ **Lý do hủy**',
        value: cancelReason,
        inline: false
      }
    ];
  }

  return updatedEmbed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Log for debugging
    console.log('Discord interaction received:', {
      headers: Object.fromEntries(request.headers.entries()),
      body: body.substring(0, 200) // First 200 chars
    });

    // Verify Discord signature
    const isValidSignature = verifyDiscordRequest(request, body);
    if (!isValidSignature) {
      console.log('Signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const interaction = JSON.parse(body);
    console.log('Interaction type:', interaction.type);

    // Handle ping
    if (interaction.type === InteractionType.PING) {
      console.log('Responding to PING with PONG');
      // Discord expects immediate response for PING
      return NextResponse.json({ type: 1 }, { status: 200 });
    }

    // Handle button interactions
    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      const customId = interaction.data.custom_id;
      console.log('=== DISCORD BUTTON INTERACTION DEBUG ===');
      console.log('Raw custom_id:', customId);
      console.log('custom_id type:', typeof customId);
      console.log('custom_id length:', customId?.length);

      // Handle test button interactions
      if (customId.startsWith('test_')) {
        const [, action, ...orderIdParts] = customId.split('_');
        const orderId = orderIdParts.join('_');

        console.log('Test button clicked:', { action, orderId });

        const actionText = action === 'approve' ? 'CONFIRM' : 'CANCEL';
        const emoji = action === 'approve' ? '✅' : '❌';
        const color = action === 'approve' ? 0x00ff00 : 0xff0000;

        return NextResponse.json({
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            embeds: [
              {
                title: `${emoji} **Test Button Response**`,
                description: `Button **${actionText}** đã được click thành công!`,
                color: color,
                fields: [
                  {
                    name: '📋 **Test Order**',
                    value: `Order ID: \`${orderId}\`\nAction: \`${actionText}\`\nStatus: \`${
                      action === 'approve' ? 'Confirmed' : 'Cancelled'
                    }\``,
                    inline: false
                  },
                  {
                    name: '🎯 **Kết quả Test**',
                    value: `${emoji} Discord button interaction hoạt động bình thường!\nBot đã nhận và xử lý button click thành công.`,
                    inline: false
                  }
                ],
                footer: {
                  text: `ThanhHuy Store - Test Response • ${new Date().toLocaleString('vi-VN')}`
                },
                timestamp: new Date().toISOString()
              }
            ],
            components: [] // Remove buttons after interaction
          }
        });
      }

      // Handle real order button interactions
      const splitResult = customId.split('_');
      console.log('Split result:', splitResult);

      const [action, ...orderIdParts] = splitResult;
      const orderId = orderIdParts.join('_');

      console.log('=== PARSING RESULTS ===');
      console.log('action:', action);
      console.log('orderIdParts:', orderIdParts);
      console.log('orderId:', orderId);
      console.log('orderId type:', typeof orderId);
      console.log('orderId length:', orderId?.length);

      if (!['approve', 'reject'].includes(action) || !orderId) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `❌ **Lỗi:** Action không hợp lệ hoặc Order ID không tồn tại\nCustom ID: \`${customId}\`\nAction: \`${action}\`\nOrder ID: \`${orderId}\``,
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
            content: `❌ **Không tìm thấy đơn hàng**\nOrder ID: \`${orderId}\`\nVui lòng kiểm tra lại hoặc đơn hàng đã bị xóa.`,
            flags: 64 // Ephemeral
          }
        });
      }

      // Check if order is still pending
      if (order.status !== OrderStatus.pending) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `❌ **Đơn hàng đã được xử lý**\nTrạng thái hiện tại: \`${order.status}\`\nKhông thể thay đổi trạng thái từ \`${order.status}\``,
            flags: 64 // Ephemeral
          }
        });
      }

      // Get admin user info from Discord
      const adminUser = interaction.member?.nick || interaction.user?.username || 'Unknown Admin';

      try {
        // Update order status
        const newStatus = action === 'approve' ? OrderStatus.confirmed : OrderStatus.canceled;
        const cancelReason = action === 'reject' ? `Hủy qua Discord bởi ${adminUser}` : null;

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: newStatus,
            ...(cancelReason && {
              cancelReason: cancelReason,
              cancelDate: new Date()
            })
          }
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
            amount: order.amount,
            ...(cancelReason && { cancelReason: cancelReason })
          },
          resourceId: order.id,
          resourceType: 'Order'
        });

        // Send email notification to customer
        try {
          const emailContent =
            action === 'approve'
              ? 'Đơn hàng của bạn đã được xác nhận và sẽ được xử lý sớm. '
              : `Đơn hàng của bạn đã bị hủy. Lý do: ${cancelReason}. Vui lòng liên hệ với chúng tôi nếu có thắc mắc. `;

          await sendOrderConfirmationEmail(order.user.email, emailContent);
        } catch (error) {
          console.error('Error sending customer email:', error);
        }

        // Update the Discord message
        const originalEmbed = interaction.message.embeds[0];
        const updatedEmbed = createUpdatedEmbed(
          originalEmbed,
          action === 'approve' ? 'approved' : 'rejected',
          adminUser,
          cancelReason || undefined
        );

        // Send follow-up success message via Discord Bot API
        const botService = DiscordBotService.getInstance();
        if (botService.isConfigured()) {
          try {
            const followUpMessage = {
              content:
                action === 'approve'
                  ? `🎉 **THÀNH CÔNG!** Đơn hàng \`${order.id}\` đã được **DUYỆT** bởi **${adminUser}**\n✅ Trạng thái: \`pending\` → \`confirmed\`\n📧 Email thông báo đã được gửi cho khách hàng`
                  : `⚠️ **THÀNH CÔNG!** Đơn hàng \`${order.id}\` đã được **HỦY** bởi **${adminUser}**\n❌ Trạng thái: \`pending\` → \`canceled\`\n📝 Lý do: ${cancelReason}\n📧 Email thông báo đã được gửi cho khách hàng`
            };

            await botService.sendMessage(followUpMessage);
            console.log('Follow-up message sent successfully via Discord Bot API');
          } catch (error) {
            console.error('Error sending follow-up message:', error);
          }
        }

        // Respond with updated message (removes buttons)
        return NextResponse.json({
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            embeds: [updatedEmbed],
            components: [], // Remove buttons
            content:
              action === 'approve'
                ? `✅ **Đơn hàng đã được duyệt thành công!**\nOrder ID: \`${order.id}\``
                : `❌ **Đơn hàng đã được hủy!**\nOrder ID: \`${order.id}\``
          }
        });
      } catch (error) {
        console.error('Error processing order update:', error);

        // Return error response
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `❌ **Lỗi xử lý đơn hàng**\nOrder ID: \`${orderId}\`\nLỗi: ${error}\nVui lòng thử lại hoặc xử lý thủ công.`,
            flags: 64 // Ephemeral
          }
        });
      }
    }

    return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
  } catch (error) {
    console.error('Discord interaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests (for Discord verification)
export async function GET() {
  return NextResponse.json({
    message: 'Discord interactions endpoint',
    status: 'ready',
    timestamp: new Date().toISOString(),
    env_check: {
      hasPublicKey: !!process.env.DISCORD_PUBLIC_KEY,
      hasWebhookUrl: !!process.env.DISCORD_ORDER_WEBHOOK_URL,
      hasBotToken: !!process.env.DISCORD_BOT_TOKEN
    }
  });
}
