// Shared, pure-SVG listing-state illustrations (Direction A — "Red-bag hero").
//
// No "use client" and no server-only imports, so these render in BOTH the client
// infinite-scroll ("reached end") and the server empty state ("no products
// found"). Colors are the app's fixed hexes (storefront is light-only); the badge
// cut-out ring matches the listing surface (#f4f4f4) so it reads as a punch-out.

interface BagIllustrationProps {
  /** Rendered width/height in px (viewBox is square). */
  size?: number;
  className?: string;
}

/** Reached end of the list: filled red bag + check badge + sparkles. */
export function BagReachedEnd({ size = 120, className }: BagIllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden="true"
    >
      <ellipse cx="80" cy="141" rx="40" ry="6.5" fill="rgba(60,40,40,0.09)" />
      <path
        d="M60 64 C60 44 100 44 100 64"
        fill="none"
        stroke="#f85555"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M48 62 L112 62 Q120 62 121 70 L125 123 Q126 132 117 132 L43 132 Q34 132 35 123 L39 70 Q40 62 48 62 Z"
        fill="#fff0f1"
        stroke="#f85555"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M120 39 l2.1 6.4 6.4 2.1 -6.4 2.1 -2.1 6.4 -2.1 -6.4 -6.4 -2.1 6.4 -2.1 z"
        fill="#f85555"
      />
      <circle cx="37" cy="50" r="3" fill="#f85555" />
      <circle
        cx="106"
        cy="116"
        r="15"
        fill="#f85555"
        stroke="#f4f4f4"
        strokeWidth="3.5"
      />
      <path
        d="M99 116 l4.6 4.6 L113 111"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** No products found: outline (empty) bag + magnifier badge. */
export function BagNoResults({ size = 132, className }: BagIllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden="true"
    >
      <ellipse cx="80" cy="141" rx="40" ry="6.5" fill="rgba(60,40,40,0.09)" />
      <path
        d="M60 64 C60 44 100 44 100 64"
        fill="none"
        stroke="#d9d9de"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M48 62 L112 62 Q120 62 121 70 L125 123 Q126 132 117 132 L43 132 Q34 132 35 123 L39 70 Q40 62 48 62 Z"
        fill="none"
        stroke="#d9d9de"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M53 94 H107"
        stroke="#d9d9de"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="1.5 9"
        opacity="0.8"
      />
      <circle cx="104" cy="112" r="21" fill="#f4f4f4" />
      <circle cx="103" cy="110" r="11" fill="none" stroke="#f85555" strokeWidth="4.6" />
      <path
        d="M111 118 l9.5 9.5"
        stroke="#f85555"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
