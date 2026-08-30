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
 *   430px design canvas scaled to fit the viewport via AppScaler.
 *
 * variant="full"
 *   No scaling — raw viewport control.
 */
export default function Page({
  variant = 'scaled',
  outerBg,
  children,
}: {
  variant?: PageVariant;
  outerBg?: OuterBgKey;
  children: React.ReactNode;
}) {
  if (variant === 'scaled') {
    return (
      <AppScaler>
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
