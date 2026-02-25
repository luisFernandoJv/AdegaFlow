"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  db,
  auth,
  productsCollection,
  salesCollection,
  expensesCollection,
  valesCollection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  timestampToDate,
  onAuthStateChanged,
  signOut,
  initializeCollections,
  serverTimestamp,
  writeBatch,
  getDoc,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import { toast } from "sonner";

// Types
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  barcode?: string;
  createdAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  date: string;
  discount: number;
  customerName?: string;
  saleType: "item" | "daily" | "weekly";
  notes?: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: "pago" | "pendente";
  paymentMethod?: string;
  createdAt?: string;
}

export interface Vale {
  id: string;
  clientName: string;
  amount: number;
  description?: string;
  date: string;
  status: "pendente" | "pago";
  paymentMethod?: string;
  paymentDate?: string;
  createdAt?: string;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  theme: "light" | "dark";
  toggleTheme: () => void;
  isLoading: boolean;
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  sales: Sale[];
  addSale: (sale: Omit<Sale, "id">) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  vales: Vale[];
  addVale: (vale: Omit<Vale, "id">) => Promise<void>;
  updateVale: (id: string, vale: Partial<Vale>) => Promise<void>;
  deleteVale: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const removeUndefined = (
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Timestamp)
      ) {
        cleaned[key] = removeUndefined(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("[v0] Login attempt for:", email);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("[v0] Login successful");
      return true;
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      console.log(
        "[v0] Login error:",
        firebaseError.code,
        firebaseError.message,
      );

      if (
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/invalid-credential" ||
        firebaseError.code === "auth/wrong-password"
      ) {
        try {
          console.log("[v0] Attempting to create new user...");
          await createUserWithEmailAndPassword(auth, email, password);
          console.log("[v0] New user created successfully");
          return true;
        } catch (createError: unknown) {
          const createFirebaseError = createError as {
            code?: string;
            message?: string;
          };
          console.error(
            "[v0] Create user error:",
            createFirebaseError.code,
            createFirebaseError.message,
          );
          toast.error("Erro ao criar conta. Tente novamente.");
          return false;
        }
      }
      toast.error("Credenciais invalidas");
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Sessão encerrada");
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast.error("Erro ao encerrar sessão");
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setIsLoading(false);
      if (currentUser) {
        await initializeCollections();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSales([]);
      setExpenses([]);
      setVales([]);
      return;
    }

    const unsubProducts = onSnapshot(
      query(productsCollection, orderBy("name")),
      (snapshot) => {
        const productsData = snapshot.docs
          .filter((doc) => doc.id !== "_init_")
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: timestampToDate(doc.data().createdAt),
          })) as Product[];
        setProducts(productsData);
      },
      (error) => console.error("Erro produtos:", error),
    );

    const unsubSales = onSnapshot(
      query(salesCollection, orderBy("createdAt", "desc")),
      (snapshot) => {
        const salesData = snapshot.docs
          .filter((doc) => doc.id !== "_init_")
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: timestampToDate(doc.data().date),
            createdAt: timestampToDate(doc.data().createdAt),
          })) as Sale[];
        setSales(salesData);
      },
      (error) => console.error("Erro vendas:", error),
    );

    const unsubExpenses = onSnapshot(
      query(expensesCollection, orderBy("date", "desc")),
      (snapshot) => {
        const expensesData = snapshot.docs
          .filter((doc) => doc.id !== "_init_")
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: timestampToDate(doc.data().date),
            createdAt: timestampToDate(doc.data().createdAt),
          })) as Expense[];
        setExpenses(expensesData);
      },
      (error) => console.error("Erro despesas:", error),
    );

    const unsubVales = onSnapshot(
      query(valesCollection, orderBy("date", "desc")),
      (snapshot) => {
        const valesData = snapshot.docs
          .filter((doc) => doc.id !== "_init_")
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: timestampToDate(doc.data().date),
            paymentDate: doc.data().paymentDate
              ? timestampToDate(doc.data().paymentDate)
              : undefined,
            createdAt: timestampToDate(doc.data().createdAt),
          })) as Vale[];
        setVales(valesData);
      },
      (error) => console.error("Erro vales:", error),
    );

    return () => {
      unsubProducts();
      unsubSales();
      unsubExpenses();
      unsubVales();
    };
  }, [user]);

  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const productData = removeUndefined({
        ...product,
        createdAt: serverTimestamp(),
      });
      await addDoc(productsCollection, productData);
      toast.success("Produto adicionado com sucesso");
    } catch (error) {
      toast.error("Erro ao adicionar produto");
      throw error;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      await updateDoc(
        doc(db, "products", id),
        removeUndefined(product as Record<string, unknown>),
      );
      toast.success("Produto atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar produto");
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Produto removido");
    } catch (error) {
      toast.error("Erro ao remover produto");
      throw error;
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => setCart([]);

  const addSale = async (sale: Omit<Sale, "id">) => {
    console.log("[v0] Starting sale process:", sale.saleType);
    console.log("[v0] Sale items:", sale.items.length);
    console.log("[v0] Sale total:", sale.total);

    try {
      // For item sales, update stock first
      if (sale.saleType === "item" && sale.items.length > 0) {
        console.log("[v0] Processing item sale with stock update...");

        const batch = writeBatch(db);
        const saleRef = doc(salesCollection);

        for (const item of sale.items) {
          const productRef = doc(db, "products", item.id);
          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            throw new Error(`Produto ${item.name} nao encontrado.`);
          }

          const currentStock = productSnap.data().stock || 0;
          console.log(
            `[v0] Product ${item.name}: stock=${currentStock}, needed=${item.quantity}`,
          );

          if (currentStock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para ${item.name}. Disponivel: ${currentStock}`,
            );
          }

          batch.update(productRef, {
            stock: currentStock - item.quantity,
          });
        }

        const saleData = removeUndefined({
          ...sale,
          items: sale.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
          })),
          date: Timestamp.fromDate(new Date(sale.date)),
          createdAt: serverTimestamp(),
        });

        batch.set(saleRef, saleData);
        await batch.commit();
        console.log("[v0] Item sale committed successfully");
      } else {
        // For daily/weekly sales, just add the sale document
        console.log("[v0] Processing daily/weekly sale...");

        const saleData = removeUndefined({
          ...sale,
          items: [],
          date: Timestamp.fromDate(new Date(sale.date)),
          createdAt: serverTimestamp(),
        });

        await addDoc(salesCollection, saleData);
        console.log("[v0] Daily/weekly sale added successfully");
      }

      clearCart();
      toast.success("Venda realizada com sucesso!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao processar venda";
      console.error("[v0] Sale error:", error);
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await deleteDoc(doc(db, "sales", id));
      toast.success("Venda removida");
    } catch (error) {
      toast.error("Erro ao remover venda");
      throw error;
    }
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const expenseData = removeUndefined({
        ...expense,
        date: Timestamp.fromDate(new Date(expense.date)),
        createdAt: serverTimestamp(),
      });
      await addDoc(expensesCollection, expenseData);
      toast.success("Despesa registrada");
    } catch (error) {
      toast.error("Erro ao registrar despesa");
      throw error;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      const updateData = removeUndefined({
        ...expense,
        date: expense.date
          ? Timestamp.fromDate(new Date(expense.date))
          : undefined,
      } as Record<string, unknown>);
      await updateDoc(doc(db, "expenses", id), updateData);
      toast.success("Despesa atualizada");
    } catch (error) {
      toast.error("Erro ao atualizar despesa");
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      toast.success("Despesa removida");
    } catch (error) {
      toast.error("Erro ao remover despesa");
      throw error;
    }
  };

  const addVale = async (vale: Omit<Vale, "id">) => {
    try {
      const valeData = removeUndefined({
        ...vale,
        date: Timestamp.fromDate(new Date(vale.date)),
        paymentDate: vale.paymentDate
          ? Timestamp.fromDate(new Date(vale.paymentDate))
          : undefined,
        createdAt: serverTimestamp(),
      });
      await addDoc(valesCollection, valeData);
      toast.success("Vale registrado");
    } catch (error) {
      toast.error("Erro ao registrar vale");
      throw error;
    }
  };

  const updateVale = async (id: string, vale: Partial<Vale>) => {
    try {
      const updateData = removeUndefined({
        ...vale,
        date: vale.date ? Timestamp.fromDate(new Date(vale.date)) : undefined,
        paymentDate: vale.paymentDate
          ? Timestamp.fromDate(new Date(vale.paymentDate))
          : undefined,
      } as Record<string, unknown>);
      await updateDoc(doc(db, "vales", id), updateData);
      toast.success("Vale atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar vale");
      throw error;
    }
  };

  const deleteVale = async (id: string) => {
    try {
      await deleteDoc(doc(db, "vales", id));
      toast.success("Vale removido");
    } catch (error) {
      toast.error("Erro ao remover vale");
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        theme,
        toggleTheme,
        isLoading,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        sales,
        addSale,
        deleteSale,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        vales,
        addVale,
        updateVale,
        deleteVale,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
