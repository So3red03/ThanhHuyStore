#!/usr/bin/env node

/**
 * Test Unified Event System
 * Usage: node scripts/test-unified-events.js
 * 
 * This script tests the unified event tracking system by creating sample events
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample user ID (replace with actual user ID from your database)
const TEST_USER_ID = '6756b8b8b8b8b8b8b8b8b8b8'; // Replace with real user ID

async function testUnifiedEvents() {
  try {
    console.log('🚀 Testing Unified Event System...');
    
    // Test Phase 1 Events
    console.log('\n🟢 Testing Phase 1 Events...');
    
    // Profile Update
    await createTestEvent({
      eventType: 'PROFILE_UPDATED',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Tài khoản vừa cập nhật hồ sơ',
      details: {
        title: 'Cập nhật thông tin cá nhân',
        uiData: { userId: TEST_USER_ID },
        isUserActivity: true
      }
    });
    
    // Password Change
    await createTestEvent({
      eventType: 'PASSWORD_CHANGED',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Tài khoản vừa thay đổi mật khẩu',
      details: {
        title: 'Thay đổi mật khẩu',
        uiData: { userId: TEST_USER_ID },
        isUserActivity: true
      }
    });
    
    // Product Review
    await createTestEvent({
      eventType: 'PRODUCT_REVIEWED',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Đã bình luận và đánh giá sản phẩm iPhone 15',
      details: {
        title: 'Bình luận và đánh giá sản phẩm',
        uiData: {
          productId: 'test-product-1',
          productName: 'iPhone 15',
          rating: 5,
          hasComment: true,
          comment: 'Sản phẩm rất tốt!'
        },
        isUserActivity: true
      }
    });
    
    // Test Phase 2 Events
    console.log('\n🟡 Testing Phase 2 Events...');
    
    // Order Created
    await createTestEvent({
      eventType: 'ORDER_CREATED',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Tài khoản vừa đặt hàng 2 sản phẩm',
      details: {
        title: 'Đơn hàng được tạo',
        uiData: {
          orderId: 'test-order-1',
          products: [
            {
              id: 'product-1',
              name: 'iPhone 15',
              image: '/placeholder.png'
            },
            {
              id: 'product-2',
              name: 'AirPods Pro',
              image: '/placeholder.png'
            }
          ]
        },
        isUserActivity: true
      }
    });
    
    // Payment Success
    await createTestEvent({
      eventType: 'PAYMENT_SUCCESS',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Đã thanh toán đơn hàng #test-order-1',
      details: {
        title: 'Thanh toán thành công',
        uiData: {
          orderId: 'test-order-1',
          amount: 25000000,
          paymentMethod: 'stripe'
        },
        isUserActivity: true
      }
    });
    
    // Test Phase 3 Events
    console.log('\n🔴 Testing Phase 3 Events...');
    
    // User Registration
    await createTestEvent({
      eventType: 'USER_REGISTRATION',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Tài khoản mới được tạo qua email',
      details: {
        title: 'Đăng ký tài khoản',
        uiData: {
          registrationMethod: 'email',
          userName: 'Test User',
          userEmail: 'test@example.com'
        },
        isUserActivity: true
      }
    });
    
    // Cart Updated
    await createTestEvent({
      eventType: 'CART_UPDATED',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Thêm vào giỏ hàng: MacBook Pro',
      details: {
        title: 'Thêm vào giỏ hàng',
        uiData: {
          action: 'add',
          productId: 'macbook-pro-1',
          productName: 'MacBook Pro',
          quantity: 1
        },
        isUserActivity: true
      }
    });
    
    // Search Performed
    await createTestEvent({
      eventType: 'SEARCH_PERFORMED',
      category: 'BUSINESS',
      severity: 'LOW',
      userId: TEST_USER_ID,
      description: 'Tìm kiếm: "iPhone"',
      details: {
        title: 'Tìm kiếm sản phẩm',
        uiData: {
          searchQuery: 'iPhone',
          resultsCount: 15,
          filters: { category: 'electronics', priceRange: '10-30' }
        },
        isUserActivity: true
      }
    });
    
    console.log('\n✅ All test events created successfully!');
    
    // Verify events
    const eventCount = await prisma.auditLog.count({
      where: {
        userId: TEST_USER_ID,
        category: 'BUSINESS'
      }
    });
    
    console.log(`📊 Total user activity events: ${eventCount}`);
    
    // Show recent events
    const recentEvents = await prisma.auditLog.findMany({
      where: {
        userId: TEST_USER_ID,
        category: 'BUSINESS'
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        eventType: true,
        description: true,
        timestamp: true
      }
    });
    
    console.log('\n📋 Recent events:');
    recentEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.eventType}: ${event.description}`);
    });
    
    console.log('\n🎉 Test completed! Check ActivityTimeline UI to verify events display correctly.');
    
  } catch (error) {
    console.error('❌ Error testing unified events:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestEvent(eventData) {
  try {
    await prisma.auditLog.create({
      data: {
        ...eventData,
        timestamp: new Date(),
        createdAt: new Date()
      }
    });
    console.log(`✅ Created: ${eventData.eventType}`);
  } catch (error) {
    console.error(`❌ Failed to create ${eventData.eventType}:`, error.message);
  }
}

// Run the test
testUnifiedEvents();
