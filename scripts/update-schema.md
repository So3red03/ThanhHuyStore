# 🔄 Hướng dẫn cập nhật Database Schema

## 📋 **CÁC BƯỚC THỰC HIỆN**

### **1. Backup Database (Quan trọng!)**
```bash
# Backup MongoDB
mongodump --uri="your_mongodb_connection_string" --out=backup_$(date +%Y%m%d)

# Hoặc backup qua MongoDB Compass/Atlas
```

### **2. Cập nhật Prisma Schema**
```bash
# Generate Prisma client với schema mới
npx prisma generate

# Push schema changes to database
npx prisma db push

# Hoặc tạo migration (khuyến nghị cho production)
npx prisma migrate dev --name add-returns-and-shipping
```

### **3. Verify Schema Update**
```bash
# Kiểm tra schema đã được cập nhật
npx prisma studio

# Hoặc check qua MongoDB Compass
```

### **4. Uncomment API Code**

Sau khi schema được cập nhật thành công, uncomment các phần code đã được comment:

#### **A. Returns APIs**
- `src/app/api/returns/create/route.ts`
- `src/app/api/returns/list/route.ts` 
- `src/app/api/returns/[id]/process/route.ts`

#### **B. Shipping APIs**
- `src/app/api/shipping/create-order/route.ts`
- `src/app/api/shipping/tracking/[orderCode]/route.ts`

### **5. Test APIs**
```bash
# Test return request creation
curl -X POST http://localhost:3000/api/returns/create \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test","type":"RETURN","reason":"Test"}'

# Test shipping fee calculation
curl -X POST http://localhost:3000/api/shipping/calculate-fee \
  -H "Content-Type: application/json" \
  -d '{"to_district_id":1442,"to_ward_code":"21012","weight":1000}'
```

## 🔧 **TROUBLESHOOTING**

### **Lỗi thường gặp:**

1. **"Property 'returnRequest' does not exist"**
   - Chạy `npx prisma generate` để regenerate client

2. **"Cannot find module"**
   - Xóa `.next` folder: `rm -rf .next`
   - Restart dev server: `npm run dev`

3. **Database connection issues**
   - Kiểm tra MongoDB connection string
   - Verify database permissions

### **Rollback nếu cần:**
```bash
# Restore từ backup
mongorestore --uri="your_mongodb_connection_string" backup_folder/

# Revert Prisma schema
git checkout HEAD~1 -- prisma/schema.prisma
npx prisma generate
```

## ✅ **VERIFICATION CHECKLIST**

- [ ] Database backup completed
- [ ] Prisma schema updated successfully
- [ ] New models (ReturnRequest) created in database
- [ ] Order model updated with shipping fields
- [ ] API endpoints working without TypeScript errors
- [ ] UI components can access new APIs
- [ ] GHN integration configured with valid credentials

## 🚀 **POST-UPDATE TASKS**

1. **Configure GHN credentials** in `.env`
2. **Test return request flow** end-to-end
3. **Test shipping integration** with real addresses
4. **Update admin permissions** if needed
5. **Train admin users** on new features

---

**⚠️ Lưu ý**: Luôn test trên development environment trước khi deploy lên production!
