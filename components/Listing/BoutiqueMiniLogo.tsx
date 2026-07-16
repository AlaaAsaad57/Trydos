import Image from "next/image";
import { GetImageUrl } from "utils/server";

// Compact store logo that lives inside the sticky bar and crossfades in when the
// header is collapsed (visibility is driven purely by CSS via [data-collapsed]).
export default async function BoutiqueMiniLogo({
  boutiquePromise,
}: {
  boutiquePromise: Promise<{ icon?: string; name?: string } | null>;
}) {
  const boutique = await boutiquePromise;
  if (!boutique?.icon) return null;
  return (
    <div data-cy="boutique_mini_logo" className="brand-mini align-center" aria-hidden>
      <Image
        alt={boutique?.name ?? ""}
        width={90}
        height={18}
        className="w-[25px] h-[25px] rounded-[5px]"
        src={GetImageUrl(boutique.icon)}
      />
    </div>
  );
}
