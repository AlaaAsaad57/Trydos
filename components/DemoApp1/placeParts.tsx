import React from "react";

/**
 * Place names joined with " | ", in the page's reading order.
 *
 * Each name is its own <bdi>. Without that, an Arabic line of Latin names
 * ("City center | Mazzeh | Aleppo | سوريا") runs the Latin names together as
 * one left-to-right piece, and the browser shows them in reverse: the
 * province came first, read from the right. Isolated, every name keeps its
 * place, and the separators follow the page's direction.
 */
export function PlaceParts({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={`${part}-${i}`}>
          {i > 0 && " | "}
          <bdi>{part}</bdi>
        </React.Fragment>
      ))}
    </>
  );
}
