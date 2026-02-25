import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  where,
  writeBatch,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBM-qal1l5fLhutQiCbVq3VXc8p73OhDrQ",
  authDomain: "postocidadeadega.firebaseapp.com",
  projectId: "postocidadeadega",
  storageBucket: "postocidadeadega.firebasestorage.app",
  messagingSenderId: "849638889619",
  appId: "1:849638889619:web:4cc151389b358092735566",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);

// Collection references
export const productsCollection = collection(db, "products");
export const salesCollection = collection(db, "sales");
export const expensesCollection = collection(db, "expenses");
export const valesCollection = collection(db, "vales");
export const configCollection = collection(db, "config");

// Helper functions
export const timestampToDate = (
  timestamp: Timestamp | string | { seconds: number },
): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  return timestamp?.toString() || new Date().toISOString();
};

export const dateToTimestamp = (date: string | Date): Timestamp => {
  if (typeof date === "string") {
    return Timestamp.fromDate(new Date(date));
  }
  return Timestamp.fromDate(date);
};

// Initialize collections with proper error handling
export const initializeCollections = async () => {
  console.log("[v0] Starting Firebase collections initialization...");

  try {
    // Initialize products collection with sample data
    const productsSnapshot = await getDocs(productsCollection);
    console.log("[v0] Products collection docs:", productsSnapshot.size);

    if (productsSnapshot.empty) {
      console.log("[v0] Creating sample products...");
      const sampleProducts = [
        {
          name: "Cerveja Skol Lata 350ml",
          category: "bebidas",
          price: 3.5,
          cost: 2.5,
          stock: 100,
          minStock: 20,
          unit: "un",
          barcode: "7891234567890",
          createdAt: serverTimestamp(),
        },
        {
          name: "Cerveja Brahma Lata 350ml",
          category: "bebidas",
          price: 3.5,
          cost: 2.5,
          stock: 80,
          minStock: 20,
          unit: "un",
          barcode: "7891234567892",
          createdAt: serverTimestamp(),
        },
        {
          name: "Whisky Jack Daniels 1L",
          category: "destilados",
          price: 150.0,
          cost: 100.0,
          stock: 10,
          minStock: 3,
          unit: "un",
          barcode: "7891234567891",
          createdAt: serverTimestamp(),
        },
        {
          name: "Vinho Tinto Suave 750ml",
          category: "vinhos",
          price: 25.0,
          cost: 15.0,
          stock: 25,
          minStock: 5,
          unit: "un",
          barcode: "7891234567893",
          createdAt: serverTimestamp(),
        },
        {
          name: "Amendoim Japones 100g",
          category: "petiscos",
          price: 5.0,
          cost: 3.0,
          stock: 50,
          minStock: 10,
          unit: "un",
          barcode: "7891234567894",
          createdAt: serverTimestamp(),
        },
      ];

      for (const product of sampleProducts) {
        try {
          await addDoc(productsCollection, product);
          console.log("[v0] Created product:", product.name);
        } catch (err) {
          console.error("[v0] Error creating product:", product.name, err);
        }
      }
    }

    // Initialize other collections
    const collections = [
      { ref: salesCollection, name: "sales" },
      { ref: expensesCollection, name: "expenses" },
      { ref: valesCollection, name: "vales" },
    ];

    for (const col of collections) {
      try {
        const snapshot = await getDocs(col.ref);
        if (snapshot.empty) {
          console.log(`[v0] Initializing ${col.name} collection...`);
          await setDoc(doc(db, col.name, "_system_init_"), {
            initialized: true,
            createdAt: serverTimestamp(),
            type: "system",
          });
        }
      } catch (err) {
        console.error(`[v0] Error initializing ${col.name}:`, err);
      }
    }

    // Initialize config
    try {
      await setDoc(
        doc(configCollection, "system"),
        {
          lastInit: serverTimestamp(),
          version: "1.0.0",
          status: "active",
        },
        { merge: true },
      );
      console.log("[v0] Config initialized successfully");
    } catch (err) {
      console.error("[v0] Error initializing config:", err);
    }

    console.log("[v0] Firebase initialization complete");
  } catch (error) {
    console.error("[v0] Error during Firebase initialization:", error);
  }
};

export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp,
  serverTimestamp,
  writeBatch,
  setDoc,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

export type { User };
