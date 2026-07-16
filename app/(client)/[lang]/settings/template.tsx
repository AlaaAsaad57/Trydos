"use client";
import InitialNavigation from "components/global/InitialNavigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // We use a ref to calculate direction immediately during render
  // instead of waiting for a useEffect.
  const prevPathRef = useRef(pathname);
  const direction =
    pathname.split("/").length >= prevPathRef.current.split("/").length
      ? 1
      : -1;

  // Update the ref for the NEXT render
  prevPathRef.current = pathname;

  const pageVariants: Variants = {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (d: number) => ({
      x: d > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: { duration: 0.3 },
    }),
  };

  return (
    // Ensure the container has a stable height and hidden overflow
    <div className="relative w-full h-[calc(100dvh-102px)] overflow-hidden">
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={pathname} // Crucial: must change on every route change
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <InitialNavigation />
    </div>
  );
}
