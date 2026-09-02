import { Skeleton } from "components/Server/Skeleton";

/**
 * Placeholder for the signed-in navigation while it streams in (D-9).
 *
 * The sizes are measured from the real component, not guessed. Read off
 * http://localhost:3111/sy-en at a 1440px viewport, guest session:
 *
 *   container            1189 x 50   (flex: 1, justify-content: flex-end)
 *   cart icon              20 x 20
 *   "Hello, Welcome"       96 x 21
 *   question item          50 x 50
 *   user active icon       50 x 50
 *   auth section           39 x 30
 *
 * It reuses the real container's own class, so it flexes and aligns exactly the
 * same way. That matters more than the individual blocks: this sits beside the
 * logo at the top of every page, and a placeholder of a different height moves
 * the largest element above the fold when the real navigation arrives.
 */
export default function AuthNavSkeleton() {
  return (
    <div
      className="user-nav-container"
      data-pw="auth-nav-skeleton"
      aria-hidden="true"
    >
      <Skeleton
        className="animate-pulse"
        width={20}
        height={20}
        borderRadius="4px"
      />
      <Skeleton
        className="animate-pulse ml-[9px]"
        width={96}
        height={21}
        borderRadius="4px"
      />
      <Skeleton
        className="animate-pulse ml-[9px]"
        width={50}
        height={50}
        borderRadius="8px"
      />
      <Skeleton
        className="animate-pulse ml-[9px]"
        width={50}
        height={50}
        borderRadius="25px"
      />
      <Skeleton
        className="animate-pulse ml-[10px]"
        width={39}
        height={30}
        borderRadius="8px"
      />
    </div>
  );
}
