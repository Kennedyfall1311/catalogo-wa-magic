import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/hooks/useBanners";

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // Auto-play
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaApi, onSelect]);

  if (banners.length === 0) return null;

  // Single banner — no carousel controls
  if (banners.length === 1) {
    const b = banners[0];
    const img = <img src={b.image_url} alt="Banner" className="w-full h-auto object-cover max-h-[400px]" />;
    return (
      <div className="w-full">
        {b.link ? (
          <a href={b.link} target="_blank" rel="noopener noreferrer">{img}</a>
        ) : img}
      </div>
    );
  }

  return (
    <div className="relative w-full group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((b) => {
            const img = (
              <img
                key={b.id}
                src={b.image_url}
                alt="Banner"
                className="w-full h-auto object-cover max-h-[400px] flex-[0_0_100%]"
              />
            );
            return (
              <div key={b.id} className="flex-[0_0_100%] min-w-0">
                {b.link ? (
                  <a href={b.link} target="_blank" rel="noopener noreferrer">{img}</a>
                ) : img}
              </div>
            );
          })}
        </div>
      </div>

      {canPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canNext && (
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
