import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productsApi, isPostgresMode } from "@/lib/api-client";
import { useSellerPrefix } from "@/hooks/useSellerPrefix";
import { AddToCartDialog } from "@/components/AddToCartDialog";
import type { DbProduct } from "@/hooks/useDbProducts";

interface Props {
  product: DbProduct;
  buttonColor?: string;
  priceColor?: string;
}

interface Suggestion {
  product: DbProduct;
  reason?: string;
}

const formatPrice = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

// Cache em memória: revisitar um produto mostra as sugestões instantaneamente
const suggestionsCache = new Map<string, Suggestion[]>();

export function AiUpsellSuggestions({ product, buttonColor, priceColor }: Props) {
  const { buildPath } = useSellerPrefix();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DbProduct | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const cached = suggestionsCache.get(product.id);
      if (cached) {
        setSuggestions(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      setSuggestions([]);
      try {
        const all: DbProduct[] = (await productsApi.fetchAll()) || [];
        const pool = all.filter(
          (p) => p.active !== false && p.id !== product.id && p.name && p.price != null
        );
        if (pool.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const sameCategory = pool.filter((p) => p.category_id && p.category_id === product.category_id);
        const others = pool.filter((p) => !sameCategory.includes(p));
        const candidates = [...sameCategory, ...others].slice(0, 25);

        const finish = (list: Suggestion[]) => {
          suggestionsCache.set(product.id, list);
          if (!cancelled) setSuggestions(list);
        };

        const fallback = () =>
          candidates.slice(0, 4).map((p) => ({ product: p }));

        if (isPostgresMode()) {
          finish(fallback());
          if (!cancelled) setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke("suggest-upsell", {
          body: {
            product: {
              name: product.name,
              code: product.code,
              brand: product.brand,
              price: product.price,
              description: product.description,
              category: product.category_id,
            },
            candidates: candidates.map((p) => ({
              id: p.id,
              name: p.name,
              code: p.code,
              brand: p.brand,
              price: p.price,
              category: p.category_id,
            })),
          },
        });

        if (cancelled) return;

        const list = (!error && Array.isArray((data as any)?.suggestions)
          ? (data as any).suggestions
          : []) as { id: string; reason?: string }[];

        const mapped = list
          .map((s) => {
            const found = candidates.find((c) => c.id === s.id);
            return found ? { product: found, reason: s.reason } : null;
          })
          .filter(Boolean) as Suggestion[];

        finish(mapped.length > 0 ? mapped : fallback());
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [product.id, product.category_id]);

  if (!loading && suggestions.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">Sugestões de compra</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="aspect-square animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 items-stretch">
          {suggestions.map(({ product: p, reason }) => (
            <div key={p.id} className="flex flex-col rounded-lg border bg-card p-3">
              <Link to={buildPath(`/produto/${p.slug}`)} className="block">
                <div className="aspect-square overflow-hidden rounded bg-muted">
                  <img
                    src={p.image_url || "/placeholder.svg"}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold uppercase">{p.name}</p>
              </Link>
              {reason && (
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{reason}</p>
              )}
              <p
                className="mt-2 text-sm font-bold"
                style={priceColor ? { color: priceColor } : undefined}
              >
                {formatPrice(p.price)}
              </p>
              <button
                onClick={() => setSelected(p)}
                aria-label={`Comprar ${p.name}`}
                className={`mt-2 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                  buttonColor ? "text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                style={buttonColor ? { backgroundColor: buttonColor } : undefined}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Comprar
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <AddToCartDialog
          product={selected}
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
        />
      )}
    </section>
  );
}
