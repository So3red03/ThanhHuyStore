// Test script for order creation API
const axios = require('axios');

const testOrderCreation = async () => {
  const baseURL = 'http://localhost:3000';
  
  // Test data for simple product
  const testSimpleProduct = {
    products: [
      {
        id: "6870988ab6e5f526416a7344",
        name: "Magic Keyboard for iPad Pro 12.9‑inch (5th Generation)",
        description: "<p>ádasdasd</p>",
        category: "6768db0cd04035bd693c1c28",
        selectedImg: "https://firebasestorage.googleapis.com/v0/b/thanhhuy-store.appspot.com/o/simple-products%2Fmagic-keyboard-for-ipad-pro-129inch-5th-generation%2Fthumbnail.jpeg?alt=media&token=e3044f18-c265-4674-bb34-155d1d4a40c7",
        thumbnail: "https://firebasestorage.googleapis.com/v0/b/thanhhuy-store.appspot.com/o/simple-products%2Fmagic-keyboard-for-ipad-pro-129inch-5th-generation%2Fthumbnail.jpeg?alt=media&token=e3044f18-c265-4674-bb34-155d1d4a40c7",
        quantity: 1,
        price: 8990000,
        inStock: 19
      }
    ],
    phoneNumber: "0707887106",
    address: {
      city: "Tỉnh Hà Giang",
      country: "Việt Nam",
      line1: "633/23 Điện biên phủ, Xã Thuận Hoà, Huyện Vị Xuyên",
      postal_code: "00000"
    },
    shippingFee: 40000,
    paymentMethod: "cod"
  };

  // Test data for variant product
  const testVariantProduct = {
    products: [
      {
        id: "product-variant-id",
        name: "iPhone 15 Pro",
        description: "Latest iPhone",
        category: "smartphones",
        selectedImg: "https://example.com/iphone.jpg",
        thumbnail: "https://example.com/iphone-thumb.jpg",
        quantity: 1,
        price: 25000000,
        inStock: 5,
        variantId: "variant-silver-128gb",
        attributes: {
          color: "silver",
          storage: "128gb"
        }
      }
    ],
    phoneNumber: "0707887106",
    address: {
      city: "Hà Nội",
      country: "Việt Nam",
      line1: "123 Test Street",
      postal_code: "00000"
    },
    shippingFee: 40000,
    paymentMethod: "cod"
  };

  console.log('🧪 Testing Order Creation API...\n');

  // Test 1: Simple Product
  console.log('📱 Test 1: Simple Product Order');
  try {
    const response1 = await axios.post(`${baseURL}/api/create-payment-intent`, testSimpleProduct);
    console.log('✅ Simple product order created successfully');
    console.log('Order ID:', response1.data.createdOrder?.id);
  } catch (error) {
    console.log('❌ Simple product order failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error);
    console.log('Details:', error.response?.data?.details);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Variant Product
  console.log('📱 Test 2: Variant Product Order');
  try {
    const response2 = await axios.post(`${baseURL}/api/create-payment-intent`, testVariantProduct);
    console.log('✅ Variant product order created successfully');
    console.log('Order ID:', response2.data.createdOrder?.id);
  } catch (error) {
    console.log('❌ Variant product order failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error);
    console.log('Details:', error.response?.data?.details);
  }

  console.log('\n🏁 Test completed!');
};

// Run tests
testOrderCreation().catch(console.error);
