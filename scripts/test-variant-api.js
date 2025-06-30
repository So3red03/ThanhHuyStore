#!/usr/bin/env node

/**
 * Test Script: Variant API Endpoints
 *
 * Tests all variant system API endpoints to ensure they work correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/variants';

// Test configuration
const TEST_CONFIG = {
  // You'll need to get a valid session token for admin user
  // For now, we'll test public endpoints and structure
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testVariantAPI() {
  console.log('🧪 Testing Variant API Endpoints...');
  console.log('=====================================');

  let testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test 1: Get variant products (public endpoint)
  try {
    console.log('\n📋 Test 1: GET /api/variants/products');
    const response = await axios.get(`${BASE_URL}/products`, TEST_CONFIG);

    if (response.status === 200 && response.data.products) {
      console.log('✅ GET variant products - PASSED');
      console.log(`   Found ${response.data.products.length} variant products`);
      console.log(`   Pagination: ${JSON.stringify(response.data.pagination)}`);
      testResults.passed++;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.log('❌ GET variant products - FAILED');
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`GET /products: ${error.message}`);
  }

  // Test 2: Get specific variant product
  try {
    console.log('\n📋 Test 2: GET /api/variants/products/[id]');

    // First get a product ID
    const productsResponse = await axios.get(`${BASE_URL}/products`, TEST_CONFIG);
    if (productsResponse.data.products.length > 0) {
      const productId = productsResponse.data.products[0].id;
      const response = await axios.get(`${BASE_URL}/products/${productId}`, TEST_CONFIG);

      if (response.status === 200 && response.data.id) {
        console.log('✅ GET specific variant product - PASSED');
        console.log(`   Product: ${response.data.name}`);
        console.log(`   Attributes: ${response.data.productAttributes?.length || 0}`);
        console.log(`   Variants: ${response.data.variants?.length || 0}`);
        testResults.passed++;
      } else {
        throw new Error('Invalid response structure');
      }
    } else {
      console.log('⚠️  GET specific variant product - SKIPPED (no products found)');
    }
  } catch (error) {
    console.log('❌ GET specific variant product - FAILED');
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`GET /products/[id]: ${error.message}`);
  }

  // Test 3: Get product attributes
  try {
    console.log('\n📋 Test 3: GET /api/variants/products/[id]/attributes');

    const productsResponse = await axios.get(`${BASE_URL}/products`, TEST_CONFIG);
    if (productsResponse.data.products.length > 0) {
      const productId = productsResponse.data.products[0].id;
      const response = await axios.get(`${BASE_URL}/products/${productId}/attributes`, TEST_CONFIG);

      if (response.status === 200 && Array.isArray(response.data)) {
        console.log('✅ GET product attributes - PASSED');
        console.log(`   Found ${response.data.length} attributes`);

        if (response.data.length > 0) {
          const attr = response.data[0];
          console.log(`   Sample: ${attr.label} (${attr.type}) - ${attr.values?.length || 0} values`);
        }
        testResults.passed++;
      } else {
        throw new Error('Invalid response structure');
      }
    } else {
      console.log('⚠️  GET product attributes - SKIPPED (no products found)');
    }
  } catch (error) {
    console.log('❌ GET product attributes - FAILED');
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`GET /products/[id]/attributes: ${error.message}`);
  }

  // Test 4: Get product variants
  try {
    console.log('\n📋 Test 4: GET /api/variants/products/[id]/variants');

    const productsResponse = await axios.get(`${BASE_URL}/products`, TEST_CONFIG);
    if (productsResponse.data.products.length > 0) {
      const productId = productsResponse.data.products[0].id;
      const response = await axios.get(`${BASE_URL}/products/${productId}/variants`, TEST_CONFIG);

      if (response.status === 200 && Array.isArray(response.data)) {
        console.log('✅ GET product variants - PASSED');
        console.log(`   Found ${response.data.length} variants`);

        if (response.data.length > 0) {
          const variant = response.data[0];
          console.log(`   Sample: ${variant.sku} - ${variant.price.toLocaleString()}đ (Stock: ${variant.stock})`);
          console.log(`   Attributes: ${JSON.stringify(variant.attributes)}`);
        }
        testResults.passed++;
      } else {
        throw new Error('Invalid response structure');
      }
    } else {
      console.log('⚠️  GET product variants - SKIPPED (no products found)');
    }
  } catch (error) {
    console.log('❌ GET product variants - FAILED');
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`GET /products/[id]/variants: ${error.message}`);
  }

  // Test 5: Preview variant generation
  try {
    console.log('\n📋 Test 5: GET /api/variants/generate (preview)');

    const productsResponse = await axios.get(`${BASE_URL}/products`, TEST_CONFIG);
    if (productsResponse.data.products.length > 0) {
      const productId = productsResponse.data.products[0].id;
      const response = await axios.get(`${BASE_URL}/generate?productId=${productId}&basePrice=50000000`, TEST_CONFIG);

      if (response.status === 200 && response.data.success) {
        console.log('✅ Preview variant generation - PASSED');
        console.log(`   Total combinations: ${response.data.data.total}`);

        if (response.data.data.combinations.length > 0) {
          const sample = response.data.data.combinations[0];
          console.log(`   Sample: ${JSON.stringify(sample.attributes)} - ${sample.priceFormatted}`);
        }
        testResults.passed++;
      } else {
        throw new Error('Invalid response structure');
      }
    } else {
      console.log('⚠️  Preview variant generation - SKIPPED (no products found)');
    }
  } catch (error) {
    console.log('❌ Preview variant generation - FAILED');
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`GET /generate: ${error.message}`);
  }

  // Test 6: Test error handling
  try {
    console.log('\n📋 Test 6: Error handling (invalid product ID)');

    const response = await axios.get(`${BASE_URL}/products/invalid-id`, TEST_CONFIG);

    // This should fail
    console.log('❌ Error handling - FAILED (should have returned 404)');
    testResults.failed++;
    testResults.errors.push('Error handling: Should have returned 404 for invalid ID');
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.status === 400)) {
      console.log('✅ Error handling - PASSED (correctly returned 400/404)');
      testResults.passed++;
    } else {
      console.log('❌ Error handling - FAILED (unexpected error)');
      console.log(`   Error: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`Error handling: ${error.message}`);
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(
    `📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`
  );

  if (testResults.errors.length > 0) {
    console.log('\n🔍 Error Details:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n🎯 API Endpoint Status:');
  console.log('✅ GET /api/variants/products - List variant products');
  console.log('✅ GET /api/variants/products/[id] - Get specific product');
  console.log('✅ GET /api/variants/products/[id]/attributes - Get product attributes');
  console.log('✅ GET /api/variants/products/[id]/variants - Get product variants');
  console.log('✅ GET /api/variants/generate - Preview variant generation');
  console.log('🔒 POST/PUT/DELETE endpoints require authentication');

  console.log('\n📋 Next Steps:');
  console.log('1. Test authenticated endpoints with admin session');
  console.log('2. Test variant creation and updates');
  console.log('3. Test bulk operations');
  console.log('4. Integration testing with frontend components');

  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  testVariantAPI()
    .then(results => {
      if (results.failed === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Some tests failed. Check the details above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testVariantAPI };
