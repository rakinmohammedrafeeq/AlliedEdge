import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Accessible label; if provided, used as alt text. */
  alt?: string;
};

/**
 * Renders a consistent default profile image when a user hasn't uploaded one.
 * Use inside <AvatarFallback>.
 */
export function DefaultAvatarFallback({ className, alt = 'Default profile image' }: Props) {
  return (
    <img
      src="/default-profile.png"
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

