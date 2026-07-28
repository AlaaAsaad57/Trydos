"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Navigates away from an intercepted (modal) route whose target does not exist
 * — a dead product or boutique.
 *
 * A server `redirect()` cannot do this job here. Next isolates errors thrown
 * inside a parallel route slot: the NEXT_REDIRECT digest is serialized into the
 * RSC stream and the response stays a plain 200, so the browser never moves —
 * the same failure mode as throwing `redirect()` from streamed `generateMetadata`.
 * The modal slot therefore has to navigate from the client.
 *
 * `replace` rather than `push` so the dead URL does not sit in history and
 * bounce the user straight back into this redirect on Back.
 */
export default function NotFoundRedirect({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return null;
}
