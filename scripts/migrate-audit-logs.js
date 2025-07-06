const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateAuditLogs() {
  console.log('🔄 Starting AdminAuditLog to AuditLog migration...');

  try {
    // Check if AdminAuditLog table exists
    let adminAuditLogs = [];
    try {
      adminAuditLogs = await prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      console.log('⚠️  AdminAuditLog table not found or already removed');
      console.log("✅ Migration not needed - table already migrated or doesn't exist");
      return;
    }

    console.log(`📊 Found ${adminAuditLogs.length} AdminAuditLog records to migrate`);

    if (adminAuditLogs.length === 0) {
      console.log('✅ No records to migrate');
      return;
    }

    // 2. Transform and migrate each record
    const migratedRecords = [];

    for (const record of adminAuditLogs) {
      // Parse details if it's a JSON string
      let parsedDetails = {};
      try {
        parsedDetails = typeof record.details === 'string' ? JSON.parse(record.details) : record.details || {};
      } catch (e) {
        parsedDetails = { originalDetails: record.details };
      }

      // Map old action to new eventType and category
      const { eventType, category, severity } = mapActionToEventType(record.action);

      const migratedRecord = {
        eventType,
        category,
        severity,
        userId: record.userId,
        userEmail: parsedDetails.userEmail || null,
        userRole: parsedDetails.userRole || 'ADMIN',
        ipAddress: parsedDetails.ipAddress || null,
        userAgent: parsedDetails.userAgent || null,
        description: generateDescription(record.action, parsedDetails),
        details: parsedDetails,
        metadata: {
          migratedFrom: 'AdminAuditLog',
          originalAction: record.action,
          migrationDate: new Date().toISOString()
        },
        resourceId: parsedDetails.resourceId || null,
        resourceType: parsedDetails.resourceType || null,
        oldValue: parsedDetails.oldValue || null,
        newValue: parsedDetails.newValue || null,
        timestamp: record.createdAt,
        createdAt: record.createdAt
      };

      migratedRecords.push(migratedRecord);
    }

    // 3. Batch insert into new AuditLog table
    console.log('📝 Inserting migrated records into AuditLog...');

    const batchSize = 100;
    for (let i = 0; i < migratedRecords.length; i += batchSize) {
      const batch = migratedRecords.slice(i, i + batchSize);
      await prisma.auditLog.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(
        `✅ Migrated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(migratedRecords.length / batchSize)}`
      );
    }

    console.log(`✅ Successfully migrated ${migratedRecords.length} records`);

    // 4. Verify migration
    const auditLogCount = await prisma.auditLog.count({
      where: {
        metadata: {
          path: ['migratedFrom'],
          equals: 'AdminAuditLog'
        }
      }
    });

    console.log(`🔍 Verification: ${auditLogCount} migrated records found in AuditLog`);

    if (auditLogCount === adminAuditLogs.length) {
      console.log('✅ Migration verification successful!');
      console.log('⚠️  AdminAuditLog table can now be safely removed from schema');
      console.log('⚠️  Remember to update any existing API endpoints');
    } else {
      console.log('❌ Migration verification failed - counts do not match');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to map old actions to new event types
function mapActionToEventType(action) {
  const mappings = {
    LOGIN: { eventType: 'ADMIN_LOGIN', category: 'ADMIN', severity: 'LOW' },
    LOGOUT: { eventType: 'ADMIN_LOGOUT', category: 'ADMIN', severity: 'LOW' },
    UPDATE_SETTINGS: { eventType: 'ADMIN_SETTINGS_UPDATED', category: 'ADMIN', severity: 'MEDIUM' },
    CREATE_PRODUCT: { eventType: 'PRODUCT_CREATED', category: 'ADMIN', severity: 'LOW' },
    UPDATE_PRODUCT: { eventType: 'PRODUCT_UPDATED', category: 'ADMIN', severity: 'LOW' },
    DELETE_PRODUCT: { eventType: 'PRODUCT_DELETED', category: 'ADMIN', severity: 'MEDIUM' },
    CREATE_USER: { eventType: 'USER_CREATED', category: 'ADMIN', severity: 'MEDIUM' },
    UPDATE_USER: { eventType: 'USER_UPDATED', category: 'ADMIN', severity: 'MEDIUM' },
    DELETE_USER: { eventType: 'USER_DELETED', category: 'ADMIN', severity: 'HIGH' },
    CREATE_ORDER: { eventType: 'ORDER_CREATED', category: 'BUSINESS', severity: 'LOW' },
    UPDATE_ORDER: { eventType: 'ORDER_STATUS_CHANGED', category: 'BUSINESS', severity: 'MEDIUM' },
    CANCEL_ORDER: { eventType: 'ORDER_CANCELLED', category: 'BUSINESS', severity: 'MEDIUM' },
    CREATE_VOUCHER: { eventType: 'VOUCHER_CREATED', category: 'ADMIN', severity: 'LOW' },
    UPDATE_VOUCHER: { eventType: 'VOUCHER_UPDATED', category: 'ADMIN', severity: 'LOW' },
    DELETE_VOUCHER: { eventType: 'VOUCHER_DELETED', category: 'ADMIN', severity: 'MEDIUM' }
  };

  return (
    mappings[action] || {
      eventType: action,
      category: 'ADMIN',
      severity: 'MEDIUM'
    }
  );
}

// Helper function to generate description
function generateDescription(action, details) {
  const descriptions = {
    LOGIN: 'Admin user logged in',
    LOGOUT: 'Admin user logged out',
    UPDATE_SETTINGS: 'System settings updated',
    CREATE_PRODUCT: `Product created: ${details.productName || 'Unknown'}`,
    UPDATE_PRODUCT: `Product updated: ${details.productName || 'Unknown'}`,
    DELETE_PRODUCT: `Product deleted: ${details.productName || 'Unknown'}`,
    CREATE_USER: `User created: ${details.userEmail || 'Unknown'}`,
    UPDATE_USER: `User updated: ${details.userEmail || 'Unknown'}`,
    DELETE_USER: `User deleted: ${details.userEmail || 'Unknown'}`,
    CREATE_ORDER: `Order created: ${details.orderId || 'Unknown'}`,
    UPDATE_ORDER: `Order status changed: ${details.orderId || 'Unknown'}`,
    CANCEL_ORDER: `Order cancelled: ${details.orderId || 'Unknown'}`,
    CREATE_VOUCHER: `Voucher created: ${details.voucherCode || 'Unknown'}`,
    UPDATE_VOUCHER: `Voucher updated: ${details.voucherCode || 'Unknown'}`,
    DELETE_VOUCHER: `Voucher deleted: ${details.voucherCode || 'Unknown'}`
  };

  return descriptions[action] || `Admin action: ${action}`;
}

// Run migration
if (require.main === module) {
  migrateAuditLogs()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAuditLogs };
