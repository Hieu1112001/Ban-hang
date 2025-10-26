import { getOrders } from "../services/cart.js";
function showToast(id, message) {
  const toastEl = document.getElementById(id);
  toastEl.querySelector(".toast-body").textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCEEErX_ybhvvi2W_unmIMnZTO4vEGdYE0",
  authDomain: "webbanhang-cc2c7.firebaseapp.com",
  projectId: "webbanhang-cc2c7",
  storageBucket: "webbanhang-cc2c7.appspot.com",
  messagingSenderId: "777103483355",
  appId: "1:777103483355:web:cd03654e7cdad7114ec7fe",
  measurementId: "G-B138HGZSQ3",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Get products from Firestore
async function getProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));

  const products = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });

  return products;
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Upload thất bại:", errText);
      throw new Error("Upload ảnh thất bại");
    }

    const data = await res.json();
    return data.url; // link ảnh ImageKit trả về
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Hàm lưu sản phẩm vào Firestore
async function saveProduct(product) {
  const docRef = await addDoc(collection(db, "products"), product);
  return docRef.id;
}

document.getElementById("add-product-form").onsubmit = async function (e) {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const file = document.getElementById("productImage").files[0];

  if (!file) {
    alert("Vui lòng chọn ảnh!");
    return;
  }

  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Đang xử lý...";

    // Upload ảnh qua backend
    const imageUrl = await uploadImage(file);

    // Lưu sản phẩm vào Firestore
    await saveProduct({
      name,
      price,
      image: imageUrl,
      createdAt: new Date(),
    });

    showToast("toastSuccess", "Thêm sản phẩm thành công!");
    this.reset();
    renderProducts();
  } catch (error) {
    console.error("Error:", error);
    showToast("toastError", "Có lỗi xảy ra khi thêm sản phẩm!");
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Thêm";
  }
};

// Delete product from Firestore
async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, "products", productId));
    showToast("toastSuccess", "Xoá thành công!");
  } catch (e) {
    console.error("Error deleting product: ", e);
    throw e;
  }
}

// Update product in Firestore
async function updateProduct(productId, data) {
  try {
    await updateDoc(doc(db, "products", productId), data);
  } catch (e) {
    console.error("Error updating product: ", e);
    throw e;
  }
}

// Render products
async function renderProducts(filter = "") {
  const products = await getProducts();
  const tbody = document.querySelector("#product-table tbody");
  let filtered = products;
  if (filter) {
    filtered = products.filter((p) =>
      p.name.toLowerCase().includes(filter.toLowerCase())
    );
  }

  tbody.innerHTML = filtered
    .map(
      (p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><img src="${
                  p.image
                }" style="height:50px;object-fit:contain"></td>
                <td>${p.name}</td>
                <td>${p.price.toLocaleString()}₫</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-product" data-id="${
                      p.id
                    }">Sửa</button>
                    <button class="btn btn-danger btn-sm delete-product" data-id="${
                      p.id
                    }">Xóa</button>
                </td>
            </tr>
        `
    )
    .join("");

  // Delete handler
  document.querySelectorAll(".delete-product").forEach((btn) => {
    btn.onclick = async function () {
      if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
        await deleteProduct(this.dataset.id);
        renderProducts();
      }
    };
  });

  // Edit handler
  document.querySelectorAll(".edit-product").forEach((btn) => {
    btn.onclick = async function () {
      const product = filtered.find((p) => p.id === this.dataset.id);
      document.getElementById("editProductId").value = product.id;
      document.getElementById("editProductName").value = product.name;
      document.getElementById("editProductPrice").value = product.price;
      const modal = new bootstrap.Modal(
        document.getElementById("editProductModal")
      );
      modal.show();
    };
  });
}

// Edit product form handler
// document.getElementById('edit-product-form')?.onsubmit = async function(e) {
//     e.preventDefault();
//     const id = document.getElementById('editProductId').value;
//     const name = document.getElementById('editProductName').value.trim();
//     const price = parseFloat(document.getElementById('editProductPrice').value);
//     const file = document.getElementById('editProductImage').files[0];

//     try {
//         const updateData = { name, price };

//         if (file) {
//             const storageRef = ref(storage, 'products/' + file.name);
//             const snapshot = await uploadBytes(storageRef, file);
//             updateData.image = await getDownloadURL(snapshot.ref);
//         }

//         await updateProduct(id, updateData);
//         alert('Cập nhật sản phẩm thành công!');
//         bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
//         renderProducts();
//     } catch (e) {
//         console.error("Error: ", e);
//         alert('Có lỗi xảy ra khi cập nhật sản phẩm!');
//     }
// };

// Thêm ImageKit configuration

// Sửa lại hàm uploadImage để dùng ImageKit

export async function renderOrders() {
  const orders = await getOrders();
  const tbody = document.querySelector("#order-table tbody");

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Chưa có đơn hàng</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  orders.forEach((order, i) => {
    const products = order.products || [];
    if (products.length === 0) return;

    const rowspan = products.length; // số dòng để gộp

    products.forEach((item, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
      ${index === 0 ? `<td rowspan="${rowspan}">${i + 1}</td>` : ""}
      ${
        index === 0
          ? `<td rowspan="${rowspan}">${order.customerName || ""}</td>`
          : ""
      }
      ${
        index === 0
          ? `<td rowspan="${rowspan}">${order.phoneNumber || ""}</td>`
          : ""
      }
      ${
        index === 0
          ? `<td rowspan="${rowspan}">${order.shippingAddress || ""}</td>`
          : ""
      }
      ${
        index === 0
          ? `<td rowspan="${rowspan}">${order.paymentMethod || "Tiền mặt"}</td>`
          : ""
      }
      <td>${item.name} x${item.quantity}</td>
      <td>${(item.price * item.quantity).toLocaleString()}₫</td>
    `;

      tbody.appendChild(tr);
    });

    // Dòng tổng tiền (có thể gộp cả cột sản phẩm)
    const total = products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const trTotal = document.createElement("tr");
    trTotal.innerHTML = `
    <td colspan="6" class="text-end fw-bold">Tổng</td>
    <td class="fw-bold">${total.toLocaleString()}₫</td>
  `;
    tbody.appendChild(trTotal);
  });
}

renderProducts();
renderOrders();
