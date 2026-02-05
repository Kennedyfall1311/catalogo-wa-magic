import { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { INITIAL_PRODUCTS } from "@/data/products";

const STORAGE_KEY = "catalog_products";

function loadProducts(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return INITIAL_PRODUCTS;
}

function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(loadProducts);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct = { ...product, id: crypto.randomUUID() };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  return { products, addProduct, updateProduct, removeProduct, toggleActive };
}
