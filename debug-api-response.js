// Debug API response for variant products
// Test the actual API endpoint

const axios = require('axios');

async function debugAPIResponse() {
  try {
    console.log('🔍 Testing API response...\n');

    // Test the product API endpoint
    const response = await axios.get('http://localhost:3000/api/product/686df370bfedb374fd5a24bf');
    
    console.log('📡 API Response Status:', response.status);
    console.log('📊 Product data:');
    console.log('   Name:', response.data.name);
    console.log('   Product Type:', response.data.productType);
    console.log('   Images:', JSON.stringify(response.data.images, null, 2));
    
    if (response.data.variants) {
      console.log('   Variants count:', response.data.variants.length);
      
      response.data.variants.forEach((variant, index) => {
        console.log(`\n🔸 Variant ${index + 1}:`);
        console.log(`   SKU: ${variant.sku}`);
        console.log(`   Attributes:`, JSON.stringify(variant.attributes, null, 2));
        console.log(`   Images:`, JSON.stringify(variant.images, null, 2));
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

debugAPIResponse();
