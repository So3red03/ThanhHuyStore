// Debug frontend flow with actual data structure
// This simulates what frontend receives and how it processes

// Simulate the actual database data structure we found
const mockVariantData = {
  id: "686df370bfedb374fd5a24bf",
  name: "iPad 10.9-inch Wi-Fi",
  productType: "VARIANT",
  variants: [
    {
      id: "variant1",
      sku: "SKU-XANH-64GB",
      attributes: {
        "màu-sắc": "xanh",
        "dung-lượng": "64gb"
      },
      images: [
        {
          color: "default",
          colorCode: "#000000",
          images: ["https://firebasestorage.googleapis.com/v0/b/thanhhuy-store.appspot.com/o/variant-products%2Fipad-109-inch-wi-fi%2Fcolor-xanh_storage-64gb%2F1752036200491-0F6A1CFEA10040A4CBB2857F6627BAB0.jpeg?alt=media&token=d459497f-e379-49c8-a25c-b68958ebf861"]
        },
        {
          color: "default", 
          colorCode: "#000000",
          images: ["https://firebasestorage.googleapis.com/v0/b/thanhhuy-store.appspot.com/o/variant-products%2Fipad-109-inch-wi-fi%2Fcolor-xanh_storage-64gb%2F1752036200491-7B5E6F878864CA0339845DA4C2755F9C.jpeg?alt=media&token=628a38e9-60a8-406c-9489-2ad2ec2a63ca"]
        },
        {
          color: "default",
          colorCode: "#000000", 
          images: ["https://firebasestorage.googleapis.com/v0/b/thanhhuy-store.appspot.com/o/variant-products%2Fipad-109-inch-wi-fi%2Fcolor-xanh_storage-64gb%2F1752036200491-7DC8B23C931987926CE05F2F745A2CD.jpeg?alt=media&token=67856b0d-665c-4533-bc7a-9c6df71b3889"]
        },
        {
          color: "default",
          colorCode: "#000000",
          images: ["https://firebasestorage.googleapis.com/v0/b/thanhhuy-store.appspot.com/o/variant-products%2Fipad-109-inch-wi-fi%2Fcolor-xanh_storage-64gb%2F1752036200491-9946335B3009D43489FE8ED1428E973B.jpeg?alt=media&token=ae9be8f3-c498-4cde-907d-977cb21d34c7"]
        }
      ]
    }
  ]
};

// Simulate getColorCode function
const getColorCode = (color) => {
  const colorMap = {
    'đỏ': '#ef4444',
    'red': '#ef4444',
    'xanh': '#3b82f6', 
    'blue': '#3b82f6',
    'xanh-lá': '#22c55e',
    'green': '#22c55e',
    'vàng': '#eab308',
    'yellow': '#eab308',
    'tím': '#a855f7',
    'purple': '#a855f7',
    'hồng': '#ec4899',
    'pink': '#ec4899',
    'cam': '#f97316',
    'orange': '#f97316',
    'đen': '#000000',
    'black': '#000000',
    'trắng': '#ffffff',
    'white': '#ffffff',
    'xám': '#6b7280',
    'gray': '#6b7280',
    'bạc': '#9ca3af',
    'silver': '#9ca3af',
    'bgc': '#4285f4'
  };
  
  return colorMap[color?.toLowerCase()] || '#6b7280';
};

// Simulate ProductCard getDefaultImage function (NEW LOGIC)
function getDefaultImage(product) {
  console.log('🔍 Testing getDefaultImage with product:', product.name);
  
  if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
    const firstVariant = product.variants[0];
    console.log('🔍 First variant:', firstVariant.sku);
    console.log('🔍 Variant images:', firstVariant.images);
    
    if (firstVariant.images && firstVariant.images.length > 0) {
      console.log('🔍 firstVariant.images type:', typeof firstVariant.images);
      console.log('🔍 firstVariant.images isArray:', Array.isArray(firstVariant.images));
      console.log('🔍 firstVariant.images[0] type:', typeof firstVariant.images[0]);
      console.log('🔍 firstVariant.images[0]:', firstVariant.images[0]);

      // Check if images is array of strings (old format) or array of objects (new format)
      if (typeof firstVariant.images[0] === 'string') {
        // Old format: images is array of URLs
        console.log('📸 Using old format - array of URLs');
        const result = {
          color: firstVariant.attributes?.color || firstVariant.attributes?.['màu-sắc'] || 'default',
          colorCode: getColorCode(firstVariant.attributes?.color || firstVariant.attributes?.['màu-sắc']),
          images: firstVariant.images
        };
        console.log('✅ Using variant images (old format):', result);
        return result;
      } else {
        // New format: images is array of objects - MERGE ALL IMAGES
        console.log('📸 Using new format - array of objects');
        console.log('🔍 All image objects:', firstVariant.images);
        
        const allImages = [];
        firstVariant.images.forEach((imageObj, index) => {
          console.log(`🖼️ Image object ${index}:`, imageObj);
          if (imageObj && imageObj.images && Array.isArray(imageObj.images)) {
            allImages.push(...imageObj.images);
          }
        });
        
        console.log('🎯 Merged all images:', allImages);

        if (allImages.length > 0) {
          const result = {
            color:
              firstVariant.attributes?.color ||
              firstVariant.attributes?.['màu-sắc'] ||
              firstVariant.images[0]?.color ||
              'default',
            colorCode:
              getColorCode(firstVariant.attributes?.color || firstVariant.attributes?.['màu-sắc']) ||
              firstVariant.images[0]?.colorCode ||
              '#6b7280',
            images: allImages
          };
          console.log('✅ Using variant images (new format - merged):', result);
          return result;
        } else {
          console.log('❌ No images found after merging');
        }
      }
    }
  }
  
  // Fallback
  return {
    color: 'default',
    colorCode: '#6b7280',
    images: ['/noavatar.png']
  };
}

// Test the function
console.log('🧪 Testing frontend logic with actual database structure...\n');
const result = getDefaultImage(mockVariantData);
console.log('\n🎯 Final result:', result);
console.log('\n✅ Expected: Should have 4 images merged into one array');
console.log('📊 Actual images count:', result.images.length);
