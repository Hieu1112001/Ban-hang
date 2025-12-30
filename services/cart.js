// firebase-cart.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Thêm hàm getCurrentUser
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || null;
}

const firebaseConfig = {
  apiKey: "AIzaSyCEEErX_ybhvvi2W_unmIMnZTO4vEGdYE0",
  authDomain: "webbanhang-cc2c7.firebaseapp.com",
  projectId: "webbanhang-cc2c7",
  storageBucket: "webbanhang-cc2c7.appspot.com",
  messagingSenderId: "777103483355",
  appId: "1:777103483355:web:cd03654e7cdad7114ec7fe",
  measurementId: "G-B138HGZSQ3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Giả sử dùng guest user
const USER_ID = "guest";

// Lấy giỏ hàng
export async function getCart({ name, phone, address }) {
    console.log('chạy vào đây');
    console.log(name, phone, address);
    
  const user = getCurrentUser();
  const cartKey = user ? `cart_${user.id}` : 'cart_guest';
  const cartsJson = localStorage.getItem(cartKey);
  let products = [];

  if (cartsJson) {
    const carts = JSON.parse(cartsJson);
    products =
      carts.length > 0
        ? carts.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
          }))
        : [];
  }

  if (!name || !phone || !address) {
    console.error("Thông tin khách hàng không hợp lệ!");
    return null;
  }

  return {
    customerName: name,
    phoneNumber: phone,
    shippingAddress: address,
    products: products,
    orderDate: new Date(),
  };
}

/**
 * Lưu đơn hàng vào Firestore
 * @param {Object} customer - { name, phone, address }
 */
export async function saveCartToFirebase(customer) {
    console.log('chạy vào đây');
    
  const order = await getCart(customer);

  if (!order) {
    console.error("Không có dữ liệu để lưu!");
    return false;
  }

  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...order
    //   orderDate: serverTimestamp(),
    });
    console.log(docRef);
    
    console.log("Đơn hàng đã lưu với ID:", docRef.id);
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu giỏ hàng:", error);
    return false;
  }
}

export async function getCartShowProduct() {
  // 1. Lấy giỏ hàng
  const cartRef = doc(db, "carts");
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return [];

  const cartItems = cartSnap.data().items || [];

  if (cartItems.length === 0) return [];

  // 2. Lấy tất cả sản phẩm từ Firestore
  const productsSnap = await getDocs(collection(db, "products"));
  const products = [];
  productsSnap.forEach((doc) => products.push({ id: doc.id, ...doc.data() }));

  // 3. Nối thông tin sản phẩm với số lượng từ cart
  const cartDetails = cartItems
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null; // sản phẩm bị xóa
      return {
        ...product,
        quantity: item.quantity,
      };
    })
    .filter(Boolean); // loại bỏ các null

  return cartDetails; // [{id, name, price, image, quantity}, ...]
}

export async function getOrders() {
  const snapshot = await getDocs(collection(db, "orders"));
  const orders = [];
  snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
  return orders;
}

export async function getCartDetails() {
  const cartRef = doc(db, "carts");
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return [];

  const items = cartSnap.data().items || [];

  // Lấy chi tiết từng sản phẩm từ collection 'products'
  const productsSnapshot = await getDocs(collection(db, "products"));
  const products = [];
  productsSnapshot.forEach((doc) =>
    products.push({ id: doc.id, ...doc.data() })
  );

  // Nối quantity với thông tin sản phẩm
  const cartDetails = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null; // sản phẩm đã bị xóa
      return { ...product, quantity: item.quantity };
    })
    .filter(Boolean);

  return cartDetails;
}

// Thêm sản phẩm vào giỏ hàng
export async function addToCart(productId) {
  const cartRef = doc(db, "carts");
  const cartSnap = await getDoc(cartRef);

  if (cartSnap.exists()) {
    const items = cartSnap.data().items || [];
    const index = items.findIndex((i) => i.productId === productId);
    if (index >= 0) {
      items[index].quantity += 1;
    } else {
      items.push({ productId, quantity: 1 });
    }
    await updateDoc(cartRef, { items, updatedAt: new Date() });
  } else {
    await setDoc(cartRef, {
      items: [{ productId, quantity: 1 }],
      updatedAt: new Date(),
    });
  }
}
// Xóa sản phẩm khỏi giỏ hàng
export async function removeFromCart(productId) {
  const cartRef = doc(db, "carts");
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return;

  const items = cartSnap
    .data()
    .items.filter((item) => item.productId !== productId);
  await updateDoc(cartRef, { items, updatedAt: new Date() });
}

// Cập nhật số lượng sản phẩm
export async function updateCartItemQuantity(productId, quantity) {
  if (quantity <= 0) {
    await removeFromCart(productId);
    return;
  }
  const cartRef = doc(db, "carts");
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return;

  let items = cartSnap.data().items;
  const index = items.findIndex((item) => item.productId === productId);
  if (index >= 0) {
    items[index].quantity = quantity;
    await updateDoc(cartRef, { items, updatedAt: new Date() });
  }
}

// Thanh toán: lưu đơn hàng
export async function checkout(orderInfo) {
  const cart = await getCart();
  if (cart.length === 0) throw new Error("Giỏ hàng trống");

  const ordersRef = collection(db, "orders");
  await addDoc(ordersRef, {
    customerName: orderInfo.customerName,
    customerPhone: orderInfo.customerPhone,
    customerAddress: orderInfo.customerAddress,
    paymentMethod: orderInfo.paymentMethod,
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date(),
  });

  // Xóa giỏ hàng sau khi checkout
  await setDoc(doc(db, "carts"), { items: [], updatedAt: new Date() });
}
