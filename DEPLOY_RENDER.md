# 🚀 Deploy Backend lên Render

## 📋 YÊU CẦU TRƯỚC KHI DEPLOY

- ✅ Đã setup MongoDB Atlas (xem `SETUP_SERVICES.md`)
- ✅ Đã setup Cloudinary (xem `SETUP_SERVICES.md`)
- ✅ Đã test local thành công
- ✅ Đã import data và upload images
- ✅ Code đã được push lên GitHub

---

## 🔧 BƯỚC 1: CHUẨN BỊ GITHUB REPOSITORY

### Nếu chưa có Git repository:

```bash
cd sever
git init
git add .
git commit -m "Migrate to MongoDB and Cloudinary"
```

### Tạo repository trên GitHub:

1. Vào https://github.com/new
2. **Repository name**: `qr-vault-backend`
3. **Visibility**: Public hoặc Private (tùy bạn)
4. **KHÔNG** chọn "Initialize with README"
5. Click **"Create repository"**

### Push code lên GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/qr-vault-backend.git
git branch -M main
git push -u origin main
```

---

## 🌐 BƯỚC 2: DEPLOY LÊN RENDER

### 1. Đăng ký Render

1. Vào https://render.com
2. Click **"Get Started"**
3. Đăng nhập bằng **GitHub account**
4. Authorize Render để truy cập GitHub

### 2. Tạo Web Service

1. Click **"New +"** → **"Web Service"**
2. Click **"Connect account"** nếu chưa kết nối GitHub
3. Tìm và chọn repository **`qr-vault-backend`**
4. Click **"Connect"**

### 3. Cấu hình Web Service

**Basic Settings:**
- **Name**: `qr-vault-backend` (hoặc tên bạn thích)
- **Region**: Singapore (gần Việt Nam nhất)
- **Branch**: `main`
- **Root Directory**: để trống (hoặc `sever` nếu repo chứa cả frontend)
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Chọn **"Free"**
  - ⚠️ Sẽ sleep sau 15 phút không hoạt động
  - ⚠️ Wake-up mất ~30-60 giây

### 4. Thêm Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Thêm các biến sau:

```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app

MONGODB_URI=mongodb+srv://qrvault:YOUR_PASSWORD@cluster.mongodb.net/qr-vault?retryWrites=true&w=majority

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**⚠️ QUAN TRỌNG:**
- Thay thế `MONGODB_URI` bằng connection string thực của bạn
- Thay thế Cloudinary credentials bằng thông tin thực
- `FRONTEND_URL` sẽ cập nhật sau khi deploy frontend

### 5. Deploy!

1. Click **"Create Web Service"**
2. Render sẽ bắt đầu build và deploy
3. Đợi 3-5 phút

### 6. Kiểm tra Deploy

Sau khi deploy xong, bạn sẽ có URL dạng:
```
https://qr-vault-backend.onrender.com
```

**Test API:**
```
https://qr-vault-backend.onrender.com/api/health
```

Kết quả mong đợi:
```json
{
  "status": "ok",
  "timestamp": "2026-01-11T...",
  "database": "MongoDB",
  "storage": "Cloudinary"
}
```

---

## 🎨 BƯỚC 3: CẬP NHẬT FRONTEND (VERCEL)

### 1. Cập nhật Environment Variable

1. Vào Vercel Dashboard
2. Chọn project frontend của bạn
3. Vào **Settings** → **Environment Variables**
4. Tìm `VITE_API_URL` và click **"Edit"**
5. Thay đổi giá trị thành:
   ```
   https://qr-vault-backend.onrender.com
   ```
6. Click **"Save"**

### 2. Redeploy Frontend

1. Vào tab **"Deployments"**
2. Click **"..."** ở deployment mới nhất
3. Click **"Redeploy"**
4. Hoặc đơn giản push code mới lên GitHub

---

## 🔄 BƯỚC 4: CẬP NHẬT CORS TRÊN BACKEND

### 1. Cập nhật Environment Variable trên Render

1. Quay lại Render Dashboard
2. Vào Web Service `qr-vault-backend`
3. Vào tab **"Environment"**
4. Tìm `FRONTEND_URL` và click **"Edit"**
5. Thay đổi thành URL Vercel của bạn:
   ```
   https://your-frontend.vercel.app
   ```
6. Click **"Save Changes"**

### 2. Render sẽ tự động redeploy

Đợi 1-2 phút để Render redeploy với env vars mới.

---

## ✅ BƯỚC 5: KIỂM TRA TOÀN BỘ HỆ THỐNG

### 1. Test Backend

```
https://qr-vault-backend.onrender.com/api/health
```

### 2. Test Frontend

Mở frontend URL và thử:
- ✅ Đăng nhập
- ✅ Xem QR items
- ✅ Tạo QR item mới với upload ảnh
- ✅ Xem ảnh hiển thị đúng (từ Cloudinary)
- ✅ Xóa QR item

### 3. Kiểm tra ảnh

Ảnh bây giờ sẽ có URL dạng:
```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/qr-vault/abc123.jpg
```

Thay vì:
```
http://localhost:3000/uploads/abc123.jpg
```

---

## 🎉 HOÀN THÀNH!

Hệ thống của bạn bây giờ:
- ✅ Backend trên Render (free tier)
- ✅ Frontend trên Vercel (free tier)
- ✅ Database trên MongoDB Atlas (free tier)
- ✅ Images trên Cloudinary (free tier)
- ✅ **KHÔNG MẤT DATA KHI REDEPLOY!**

---

## 🔄 CẬP NHẬT CODE SAU NÀY

### Backend:

```bash
cd sever
# Sửa code...
git add .
git commit -m "Update backend"
git push
```

→ Render tự động deploy lại (~2-3 phút)

### Frontend:

```bash
cd frontend
# Sửa code...
git add .
git commit -m "Update frontend"
git push
```

→ Vercel tự động deploy lại (~1-2 phút)

---

## ⚠️ LƯU Ý VỀ RENDER FREE TIER

### Sleep Policy:
- Service sẽ **sleep sau 15 phút** không có request
- Lần đầu truy cập sau khi sleep mất **30-60 giây** để wake up
- Người dùng sẽ thấy loading lâu lần đầu

### Giải pháp:

**1. Chấp nhận (cho demo/test):**
- Phù hợp cho demo ngắn hạn
- Miễn phí hoàn toàn

**2. Keep-alive service (free):**
- Dùng https://uptimerobot.com (free)
- Ping backend mỗi 5 phút
- Giữ service luôn awake

**3. Upgrade (paid):**
- $7/tháng cho instance luôn online
- Không sleep
- Performance tốt hơn

---

## 🆘 XỬ LÝ LỖI

### Lỗi 1: Build Failed

**Kiểm tra:**
- Logs trong Render dashboard
- Đảm bảo `package.json` đúng
- Đảm bảo tất cả dependencies đã được cài

### Lỗi 2: MongoDB Connection Failed

**Kiểm tra:**
- `MONGODB_URI` có đúng không
- Password có đặc biệt ký tự → cần encode
- IP whitelist: `0.0.0.0/0`

### Lỗi 3: Cloudinary Upload Failed

**Kiểm tra:**
- Cloudinary credentials đúng chưa
- API Secret có đầy đủ không
- Cloud name có đúng không

### Lỗi 4: CORS Error

**Kiểm tra:**
- `FRONTEND_URL` trong Render đúng chưa
- Không có trailing slash (/)
- Redeploy sau khi thay đổi env vars

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Xem logs trong Render: **Logs** tab
2. Xem MongoDB logs trong Atlas
3. Kiểm tra browser console (F12)
4. Kiểm tra Network tab

---

## 🎯 URLS QUAN TRỌNG

Lưu lại các URLs sau:

- **Backend**: `https://qr-vault-backend.onrender.com`
- **Frontend**: `https://your-frontend.vercel.app`
- **Health Check**: `https://qr-vault-backend.onrender.com/api/health`
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary**: https://cloudinary.com/console
- **Render Dashboard**: https://dashboard.render.com
