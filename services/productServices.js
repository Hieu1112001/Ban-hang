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
    collection,
    getDocs,
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export async function getProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));

  const products = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });

  return products;
}
