import type { Product } from "@/types/product";
import sneakerImg from "@/assets/product-sneaker.jpg";
import watchImg from "@/assets/product-watch.jpg";
import bagImg from "@/assets/product-bag.jpg";
import runningImg from "@/assets/product-running.jpg";
import jacketImg from "@/assets/product-jacket.jpg";
import capImg from "@/assets/product-cap.jpg";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Tênis Urban Black",
    slug: "tenis-urban-black",
    price: 249.90,
    description: "Tênis casual em couro sintético preto. Conforto e estilo para o dia a dia.",
    image: sneakerImg,
    category: "calcados",
    active: true,
  },
  {
    id: "2",
    name: "Relógio Classic Gold",
    slug: "relogio-classic-gold",
    price: 389.90,
    originalPrice: 499.90,
    description: "Relógio dourado com design elegante. Perfeito para ocasiões especiais.",
    image: watchImg,
    category: "acessorios",
    active: true,
  },
  {
    id: "3",
    name: "Bolsa Couro Caramelo",
    slug: "bolsa-couro-caramelo",
    price: 179.90,
    description: "Bolsa transversal em couro legítimo. Prática e sofisticada.",
    image: bagImg,
    category: "acessorios",
    active: true,
  },
  {
    id: "4",
    name: "Tênis Runner White",
    slug: "tenis-runner-white",
    price: 199.90,
    originalPrice: 279.90,
    description: "Tênis esportivo branco com amortecimento premium. Ideal para corrida.",
    image: runningImg,
    category: "calcados",
    active: true,
  },
  {
    id: "5",
    name: "Jaqueta Jeans Classic",
    slug: "jaqueta-jeans-classic",
    price: 299.90,
    description: "Jaqueta jeans clássica com lavagem média. Atemporal e versátil.",
    image: jacketImg,
    category: "roupas",
    active: true,
  },
  {
    id: "6",
    name: "Boné Streetwear",
    slug: "bone-streetwear",
    price: 89.90,
    originalPrice: 119.90,
    description: "Boné aba reta em material premium. Estilo urbano.",
    image: capImg,
    category: "acessorios",
    active: true,
  },
];
