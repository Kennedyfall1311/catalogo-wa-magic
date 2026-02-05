export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  category: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { id: "1", name: "Roupas", slug: "roupas" },
  { id: "2", name: "Calçados", slug: "calcados" },
  { id: "3", name: "Acessórios", slug: "acessorios" },
  { id: "4", name: "Promoções", slug: "promocoes" },
];
