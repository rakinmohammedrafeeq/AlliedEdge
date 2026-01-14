import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reddit-style behavior:
 * - Video plays/pauses automatically based on viewport visibility.
 * - Always muted.
 * - Allows inline playback on mobile.
 */
export function AutoPlayMutedVideo({
  src,
  className,
  poster,
  rootMargin = '150px',
}: {
  src: string;
  className?: string;
  poster?: string;
  /**
   * Extend the viewport bounds. Positive values start playback a bit before
   * fully on-screen and pause a bit after leaving.
   */
  rootMargin?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Ensure muted always.
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;

    // Reduce extra browser UI actions (best-effort; varies by browser)
    // - nodownload removes download in Chrome/Edge controls
    // - noremoteplayback removes casting in some browsers
    // - fullscreen can still be allowed; keep it for UX.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).controlsList = 'nodownload noremoteplayback';
    // Prevent picture-in-picture button where supported.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).disablePictureInPicture = true;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          try {
            // Attempt to play. Some browsers may still block; ignore.
            await el.play();
          } catch {
            // no-op
          }
        } else {
          el.pause();
        }
      },
      { root: null, threshold: 0.35, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="metadata"
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      className={cn('w-full max-h-[420px] rounded-lg border bg-black/5', className)}
    />
  );
}
