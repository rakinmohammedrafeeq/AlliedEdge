import React from 'react';

/**
 * Animated background layer that matches the global Login page animation.
 *
 * Why this exists:
 * Some pages have stacking contexts / solid backgrounds / heavy content that can make
 * the global body::after animation hard to notice. This component renders the *exact*
 * same animated gradients as the global background, but inside the page DOM so it
 * can't be masked by layout.
 */
export function AnimatedBackground() {
  return <div aria-hidden className="animated-bg-layer--login" />;
}

