import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { sellersApi } from "@/lib/api-client";

interface Seller {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  active: boolean;
}

interface SellerContextType {
  seller: Seller | null;
  loading: boolean;
}

const SellerContext = createContext<SellerContextType>({ seller: null, loading: false });

export const useSeller = () => useContext(SellerContext);

export function SellerProvider({ children }: { children: ReactNode }) {
  const { sellerSlug } = useParams<{ sellerSlug: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(!!sellerSlug);

  useEffect(() => {
    if (!sellerSlug) { setSeller(null); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    sellersApi.fetchBySlug(sellerSlug)
      .then((data) => {
        if (!cancelled) setSeller(data || null);
      })
      .catch(() => {
        if (!cancelled) setSeller(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [sellerSlug]);

  return (
    <SellerContext.Provider value={{ seller, loading }}>
      {children}
    </SellerContext.Provider>
  );
}
