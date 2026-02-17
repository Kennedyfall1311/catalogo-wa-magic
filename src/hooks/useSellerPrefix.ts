import { useSeller } from "@/contexts/SellerContext";

export function useSellerPrefix() {
  const { seller } = useSeller();
  const prefix = seller ? `/v/${seller.slug}` : "";
  const buildPath = (path: string) => `${prefix}${path}`;
  return { prefix, buildPath };
}
