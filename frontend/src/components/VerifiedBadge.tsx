import * as React from 'react';

export type VerifiedBadgeProps = {
    /**
     * Pass `true` for admin users (or any user you want to flag as verified).
     */
    show?: boolean;
    /**
     * Pixel size of the icon.
     */
    size?: number;
    className?: string;
    title?: string;
};

/**
 * Small app-logo badge meant to sit next to a user's display name.
 * Uses the public `logo.svg` so it works in dev/prod without bundler imports.
 */
export function VerifiedBadge({ show, size = 16, className, title = 'Verified' }: VerifiedBadgeProps) {
    if (!show) return null;

    // Starburst background container size (gives the logo some breathing room)
    const badgeSize = Math.max(size + 10, 18);

    // A simple starburst polygon (CSS clip-path). Works in modern browsers.
    // If clip-path isn't supported, it gracefully falls back to a square.
    const starburstClipPath =
        'polygon(50% 0%, 58% 10%, 71% 4%, 74% 18%, 88% 12%, 82% 26%, 96% 29%, 84% 38%, 100% 50%, 84% 62%, 96% 71%, 82% 74%, 88% 88%, 74% 82%, 71% 96%, 58% 90%, 50% 100%, 42% 90%, 29% 96%, 26% 82%, 12% 88%, 18% 74%, 4% 71%, 16% 62%, 0% 50%, 16% 38%, 4% 29%, 18% 26%, 12% 12%, 26% 18%, 29% 4%, 42% 10%)';

    // Theme-aware colors:
    // - light mode: black background
    // - dark mode: #cdd3ff background
    //
    // NOTE: We intentionally use explicit colors here rather than CSS variables,
    // because some pages may not have the theme variables applied.
    const baseClass =
        'inline-flex items-center justify-center bg-black dark:bg-[#e3ffd7] ring-4 ring-blue-500';

    const combinedClassName = [baseClass, className].filter(Boolean).join(' ');

    return (
        <span
            title={title}
            className={combinedClassName}
            style={{
                width: badgeSize,
                height: badgeSize,
                padding: 3,
                lineHeight: 0,
                clipPath: starburstClipPath,
                WebkitClipPath: starburstClipPath,
            }}
        >
            <img
                src="/logo.svg"
                alt="Verified"
                width={size}
                height={size}
                style={{ display: 'block', objectFit: 'contain' }}
                loading="lazy"
            />
        </span>
    );
}
