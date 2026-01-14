import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export function ImageCarousel({
  imageUrls,
  className,
  imgClassName,
  heightClassName = 'h-64',
  autoSlideIntervalMs = 4000,
  slideGapPx = 12,
}: {
  imageUrls: string[];
  className?: string;
  imgClassName?: string;
  /** Tailwind height class for the viewport. */
  heightClassName?: string;
  /** Auto-advance interval for multi-image carousels. Set to 0 to disable. */
  autoSlideIntervalMs?: number;
  /** Visual gap between slides (in px). */
  slideGapPx?: number;
}) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setActiveIndex(api.selectedScrollSnap());
    update();
    api.on('select', update);
    api.on('reInit', update);
    return () => {
      api.off('select', update);
      api.off('reInit', update);
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    if (!imageUrls || imageUrls.length <= 1) return;
    if (!autoSlideIntervalMs || autoSlideIntervalMs <= 0) return;

    const id = window.setInterval(() => {
      const next = api.selectedScrollSnap() + 1;
      if (next >= imageUrls.length) {
        api.scrollTo(0);
      } else {
        api.scrollTo(next);
      }
    }, autoSlideIntervalMs);

    return () => window.clearInterval(id);
  }, [api, autoSlideIntervalMs, imageUrls]);

  if (!imageUrls || imageUrls.length === 0) return null;

  // Single image: still use same layout + object-contain for full visibility.
  if (imageUrls.length === 1) {
    const url = imageUrls[0];
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('block overflow-hidden rounded-lg border bg-black/5', heightClassName, className)}
        title="Open image"
      >
        <img
          src={url}
          alt="Post image"
          loading="lazy"
          className={cn('h-full w-full object-contain', imgClassName)}
        />
      </a>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Carousel
        className="w-full"
        opts={{ loop: false }}
        setApi={(a) => setApi(a)}
      >
        <CarouselContent className="ml-0" style={{ gap: `${slideGapPx}px` }}>
          {imageUrls.map((url, idx) => (
            <CarouselItem key={`${url}-${idx}`} className="pl-0">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('block overflow-hidden rounded-lg border bg-black/5', heightClassName)}
                title="Open image"
              >
                <img
                  src={url}
                  alt={`Post image ${idx + 1}`}
                  loading="lazy"
                  className={cn('h-full w-full object-contain', imgClassName)}
                />
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Keep nav buttons inside the card bounds */}
        <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2" />
        <CarouselNext className="right-3 top-1/2 -translate-y-1/2" />

        {/* Dots */}
        <div className="mt-2 flex items-center justify-center gap-1">
          {imageUrls.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === activeIndex}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                'h-1.5 w-4 rounded-full transition-colors',
                i === activeIndex ? 'bg-foreground' : 'bg-muted-foreground/40'
              )}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
