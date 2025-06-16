const { MongoClient } = require('mongodb');

async function fixNullTitleNotifications() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/thanhhuystore');

  try {
    console.log('Starting to fix notifications with null title...');

    await client.connect();
    const db = client.db();
    const collection = db.collection('Notification');

    // Tìm tất cả notifications có title null hoặc empty
    const nullTitleNotifications = await collection
      .find({
        $or: [{ title: null }, { title: '' }, { title: { $exists: false } }]
      })
      .toArray();

    console.log(`Found ${nullTitleNotifications.length} notifications with null title`);

    if (nullTitleNotifications.length === 0) {
      console.log('No notifications with null title found. Nothing to fix.');
      return;
    }

    // Cập nhật từng notification với title mặc định dựa trên type
    const updatePromises = nullTitleNotifications.map(async notification => {
      let defaultTitle = 'Thông báo';
      let defaultMessage = 'Thông báo hệ thống';

      switch (notification.type) {
        case 'ORDER_PLACED':
          defaultTitle = 'Đơn hàng mới';
          defaultMessage = 'Bạn có đơn hàng mới cần xử lý';
          break;
        case 'MESSAGE_RECEIVED':
          defaultTitle = 'Tin nhắn mới';
          defaultMessage = 'Bạn có tin nhắn mới';
          break;
        case 'COMMENT_RECEIVED':
          defaultTitle = 'Bình luận mới';
          defaultMessage = 'Sản phẩm của bạn có bình luận mới';
          break;
        case 'LOW_STOCK':
          defaultTitle = 'Cảnh báo hết hàng';
          defaultMessage = 'Sản phẩm sắp hết hàng';
          break;
        case 'SYSTEM_ALERT':
          defaultTitle = 'Thông báo hệ thống';
          defaultMessage = 'Thông báo từ hệ thống';
          break;
        default:
          defaultTitle = 'Thông báo';
          defaultMessage = 'Thông báo hệ thống';
      }

      console.log(`Updating notification ${notification._id} with title: ${defaultTitle}`);

      return collection.updateOne(
        { _id: notification._id },
        {
          $set: {
            title: defaultTitle,
            message: notification.message || defaultMessage
          }
        }
      );
    });

    const updateResults = await Promise.all(updatePromises);
    const updatedCount = updateResults.reduce((count, result) => count + result.modifiedCount, 0);

    console.log(`Successfully fixed ${updatedCount} notifications with null title`);
  } catch (error) {
    console.error('Error fixing null title notifications:', error);
  } finally {
    await client.close();
  }
}

fixNullTitleNotifications();
