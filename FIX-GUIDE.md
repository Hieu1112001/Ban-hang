# CÁCH SỬA LỖI ADMIN.HTML KHÔNG HIỂN THỊ SẢN PHẨM

## ✅ ĐÃ SỬA CÁC LỖI SAU:

### 1. Lỗi cú pháp JavaScript (Syntax Error)
**Vấn đề**: File `js/admin.js` thiếu dấu ngoặc đóng `}` và `)`
**Đã sửa**: Thêm dấu ngoặc đóng cho event listener

### 2. Lỗi Upload ảnh 
**Vấn đề**: Code cố gắng upload ảnh lên server `http://localhost:3000/upload` nhưng không có backend server
**Đã sửa**: Chuyển sang sử dụng Base64 encoding để lưu ảnh trực tiếp vào Firebase

### 3. Lỗi ES6 Module
**Vấn đề**: File HTML sử dụng `<script type="module">` nhưng mở trực tiếp từ file system (file://) không hỗ trợ modules
**Đã sửa**: Tạo file `server.py` để chạy HTTP server

## 🚀 CÁCH CHẠY (QUAN TRỌNG!)

**BẮT BUỘC phải chạy qua HTTP server, KHÔNG THỂ mở file HTML trực tiếp!**

### Bước 1: Mở Terminal trong VS Code
Nhấn `` Ctrl + ` `` hoặc View > Terminal

### Bước 2: Chạy lệnh sau
```bash
python server.py
```

### Bước 3: Mở trình duyệt
Truy cập: **http://localhost:8000/admin.html**

## 📝 KIỂM TRA KHI GẶP LỖI

Nếu vẫn không thấy sản phẩm:

1. **Mở Developer Tools** (nhấn F12)
2. **Xem tab Console** - kiểm tra có lỗi màu đỏ không
3. **Kiểm tra tab Network** - xem có request nào bị fail không
4. **Xem Firebase Console**: 
   - Truy cập https://console.firebase.google.com/
   - Chọn project "webbanhang-cc2c7"
   - Vào Firestore Database
   - Xem collection "products" có dữ liệu không

## 🔧 CÁC TRƯỜNG HỢP THƯỜNG GẶP

### Trường hợp 1: "Failed to load module"
➡️ **Nguyên nhân**: Đang mở file trực tiếp từ File Explorer
➡️ **Giải pháp**: Phải chạy qua HTTP server như hướng dẫn trên

### Trường hợp 2: Không thấy sản phẩm nhưng không có lỗi
➡️ **Nguyên nhân**: Chưa có sản phẩm trong database
➡️ **Giải pháp**: Thêm sản phẩm mới bằng form "Thêm sản phẩm mới"

### Trường hợp 3: Lỗi Firebase
➡️ **Nguyên nhân**: Không có kết nối internet hoặc Firebase config sai
➡️ **Giải pháp**: 
   - Kiểm tra kết nối internet
   - Xem Console có lỗi Firebase không

### Trường hợp 4: Không upload được ảnh
➡️ **Nguyên nhân**: File ảnh quá lớn (>2MB)
➡️ **Giải pháp**: Nén ảnh xuống dưới 2MB trước khi upload

## 📂 CẤU TRÚC FILE QUAN TRỌNG

```
Ban-hang-main/
├── admin.html          ← Trang quản trị
├── server.py           ← HTTP server (MỚI TẠO)
├── js/
│   └── admin.js        ← Logic admin (ĐÃ SỬA)
└── services/
    ├── firebaseConfig.js
    ├── productServices.js
    └── cart.js
```

## 💡 LƯU Ý

1. **LUÔN chạy qua HTTP server** - Không bao giờ mở file HTML trực tiếp
2. **Kiểm tra Console** khi có vấn đề
3. **Ảnh được lưu dạng Base64** trong Firestore (tốt cho demo, production nên dùng Firebase Storage)
4. **Cần Internet** để kết nối Firebase

## 📞 HỖ TRỢ

Nếu vẫn gặp vấn đề, hãy:
1. Chụp màn hình Console (F12 > Console tab)
2. Chụp màn hình Network tab nếu có request bị fail
3. Kiểm tra Firebase Console xem có dữ liệu không
