const { MongoClient } = require('mongodb');

// MongoDB connection string từ .env
const uri = process.env.DATABASE_URL || 'mongodb+srv://cluster0.1llcv6p.mongodb.net/apple-shop';

async function fixNullBrands() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('apple-shop');
    const ordersCollection = db.collection('Order');
    
    // Tìm tất cả orders có products với brand null
    const ordersWithNullBrand = await ordersCollection.find({
      'products.brand': null
    }).toArray();
    
    console.log(`Found ${ordersWithNullBrand.length} orders with null brand products`);
    
    // Cập nhật từng order
    for (const order of ordersWithNullBrand) {
      const updatedProducts = order.products.map(product => ({
        ...product,
        brand: product.brand || 'Apple'
      }));
      
      await ordersCollection.updateOne(
        { _id: order._id },
        { $set: { products: updatedProducts } }
      );
      
      console.log(`Updated order ${order._id}`);
    }
    
    console.log(`✅ Successfully updated ${ordersWithNullBrand.length} orders`);
    
    // Kiểm tra lại
    const remainingNullBrands = await ordersCollection.countDocuments({
      'products.brand': null
    });
    
    console.log(`Remaining orders with null brand products: ${remainingNullBrands}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixNullBrands();
