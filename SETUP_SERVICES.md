# 🔧 Setup MongoDB Atlas & Cloudinary

## 📦 PHẦN 1: SETUP MONGODB ATLAS (5 phút)

### Bước 1: Tạo tài khoản MongoDB Atlas

1. Vào https://www.mongodb.com/cloud/atlas/register
2. Đăng ký miễn phí (có thể dùng Google account)
3. Đăng nhập vào MongoDB Atlas

### Bước 2: Tạo Cluster (Database)

1. Click **"Build a Database"** hoặc **"Create"**
2. Chọn **"M0 FREE"** tier
   - ✅ 512MB storage
   - ✅ Shared RAM
   - ✅ Hoàn toàn miễn phí
3. Chọn **Provider**: AWS
4. Chọn **Region**: Singapore (gần Việt Nam nhất)
5. **Cluster Name**: `qr-vault-cluster` (hoặc tên bạn thích)
6. Click **"Create"**

### Bước 3: Tạo Database User

1. Trong phần **Security** → **Database Access**
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `qrvault` (hoặc tên bạn thích)
5. **Password**: Tạo password mạnh (hoặc click "Autogenerate Secure Password")
   - ⚠️ **LƯU LẠI PASSWORD NÀY!**
6. **Database User Privileges**: "Read and write to any database"
7. Click **"Add User"**

### Bước 4: Whitelist IP Address

1. Trong phần **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (cho development)
   - IP: `0.0.0.0/0`
   - ⚠️ Cho production, nên restrict IP cụ thể
4. Click **"Confirm"**

### Bước 5: Lấy Connection String

1. Quay lại **Database** → Click **"Connect"** trên cluster của bạn
2. Chọn **"Connect your application"**
3. **Driver**: Node.js
4. **Version**: 5.5 or later
5. Copy **Connection String**, sẽ có dạng:
   ```
   mongodb+srv://qrvault:<password>@qr-vault-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Thay thế** `<password>` bằng password bạn đã tạo ở Bước 3
7. **Thêm database name** vào cuối: `/qr-vault`
   ```
   mongodb+srv://qrvault:YOUR_PASSWORD@qr-vault-cluster.xxxxx.mongodb.net/qr-vault?retryWrites=true&w=majority
   ```

### ✅ Hoàn thành MongoDB Atlas!

Lưu Connection String này, bạn sẽ cần nó cho file `.env`

---

## ☁️ PHẦN 2: SETUP CLOUDINARY (5 phút)

### Bước 1: Tạo tài khoản Cloudinary

1. Vào https://cloudinary.com/users/register_free
2. Đăng ký miễn phí
3. Xác nhận email

### Bước 2: Lấy API Credentials

1. Đăng nhập vào Cloudinary Dashboard
2. Bạn sẽ thấy **Account Details** ngay trên trang chủ:
   - **Cloud Name**: `dxxxxxxxxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxx`
3. Click vào **"eye icon"** để hiện API Secret
4. **LƯU LẠI** cả 3 thông tin này!

### ✅ Hoàn thành Cloudinary!

---

## 🔐 PHẦN 3: TẠO FILE .ENV

Trong thư mục `sever/`, tạo file `.env`:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# MongoDB Atlas
MONGODB_URI=mongodb+srv://qrvault:YOUR_PASSWORD@qr-vault-cluster.xxxxx.mongodb.net/qr-vault?retryWrites=true&w=majority

# Cloudinary
CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxx
```

**Thay thế**:
- `YOUR_PASSWORD` → Password MongoDB của bạn
- `qr-vault-cluster.xxxxx.mongodb.net` → Connection string của bạn
- `dxxxxxxxxxxxxx` → Cloud Name của bạn
- `123456789012345` → API Key của bạn
- `xxxxxxxxxxxxxxxxxxxxxx` → API Secret của bạn

---

## 🚀 PHẦN 4: IMPORT DATA VÀ UPLOAD IMAGES

### Bước 1: Import data từ JSON vào MongoDB

```bash
cd sever
npm run import-data
```

Bạn sẽ thấy:
```
✅ Connected to MongoDB
📥 Importing users...
  ✅ Imported user: john_doe
✅ Imported 3 users
📥 Importing QR items...
  ✅ Imported item: My QR Code
✅ Imported 5 QR items
🎉 Data import completed successfully!
```

### Bước 2: Upload ảnh lên Cloudinary

```bash
npm run upload-images
```

Bạn sẽ thấy:
```
☁️  Starting image upload to Cloudinary...
✅ Connected to MongoDB
📁 Found 5 images to upload
  📤 Uploading: abc-123.jpg...
  ✅ Uploaded: abc-123.jpg → https://res.cloudinary.com/...
     🔄 Updated QR item: My QR Code
🎉 Image upload completed!
```

### Hoặc chạy cả 2 cùng lúc:

```bash
npm run migrate
```

---

## ✅ PHẦN 5: TEST SERVER LOCAL

```bash
npm start
```

Bạn sẽ thấy:
```
==================================================
🚀 QR Vault Server is running!
==================================================
📍 Port: 3000
💾 Database: MongoDB
☁️  Storage: Cloudinary
==================================================
```

Test API:
```
http://localhost:3000/api/health
```

Kết quả:
```json
{
  "status": "ok",
  "timestamp": "2026-01-11T...",
  "database": "MongoDB",
  "storage": "Cloudinary"
}
```

---

## 🎉 HOÀN THÀNH!

Bây giờ backend của bạn đã:
- ✅ Kết nối MongoDB Atlas
- ✅ Upload ảnh lên Cloudinary
- ✅ Import data cũ thành công
- ✅ Sẵn sàng deploy lên Render!

---

## 📝 GHI CHÚ QUAN TRỌNG

### MongoDB Atlas Free Tier:
- ✅ 512MB storage
- ✅ Shared cluster
- ✅ Không giới hạn thời gian
- ⚠️ Tự động pause sau 60 ngày không hoạt động

### Cloudinary Free Tier:
- ✅ 25GB storage
- ✅ 25GB bandwidth/tháng
- ✅ 25,000 transformations/tháng
- ✅ Không giới hạn thời gian

### Bảo mật:
- ⚠️ **KHÔNG** commit file `.env` lên Git
- ⚠️ File `.env` đã được thêm vào `.gitignore`
- ✅ Chỉ commit `.env.example`
