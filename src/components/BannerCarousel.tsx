import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/hooks/useBanners";

interface BannerCarouselProps {
  banners: Banner[];
  intervalMs?: number;
}

function BannerImage({ banner }: { banner: Banner }) {
  const img = (
    <img
      src={banner.image_url}
      alt="Banner"
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );

  const wrapper = (
    <div className="w-full aspect-[16/5] sm:aspect-[19/5] max-h-[400px] overflow-hidden">
      {banner.link ? (
        <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );

  return wrapper;
}

export function BannerCarousel({ banners, intervalMs = 5000 }: BannerCarouselProps) {
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

    const interval = setInterval(() => emblaApi.scrollNext(), intervalMs);
    return () => clearInterval(interval);
  }, [emblaApi, onSelect]);

  if (banners.length === 0) return null;

  if (banners.length === 1) {
    return <BannerImage banner={banners[0]} />;
  }

  return (
    <div className="relative w-full group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((b) => (
            <div key={b.id} className="flex-[0_0_100%] min-w-0">
              <BannerImage banner={b} />
            </div>
          ))}
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