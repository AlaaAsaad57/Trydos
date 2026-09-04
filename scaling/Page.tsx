'use client';

import React from 'react';
import AppScaler from './AppScaler';
import { OUTER_BG } from './scale.config';
import type { OuterBgKey } from './scale.config';

type PageVariant = 'scaled' | 'full';

/**
 * Page — top-level wrapper for every route.
 *
 * variant="scaled" (default)
 *   The 430 x 932 design canvas, scaled whole to fit the window by AppScaler.
 *
 * variant="full"
 *   No scaling — raw viewport control.
 */
export default function Page({
  variant = 'scaled',
  outerBg,
  maxDeficit,
  children,
}: {
  variant?: PageVariant;
  outerBg?: OuterBgKey;
  /** Passed to AppScaler: how much height the current screen can give up. */
  maxDeficit?: number;
  children: React.ReactNode;
}) {
  if (variant === 'scaled') {
    return (
      <AppScaler maxDeficit={maxDeficit}>
        <div
          className={`w-full h-full ${outerBg ? ` outer-bg-${outerBg}` : ''} transition-all duration-[300]`}
          style={{ backgroundColor: outerBg && OUTER_BG[outerBg] ? OUTER_BG[outerBg] : undefined }}
        >
          {children}
        </div>
      </AppScaler>
    );
  }

  return <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>{children}</div>;
}
