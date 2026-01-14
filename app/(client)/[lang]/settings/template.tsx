"use client";
import InitialNavigation from "components/global/InitialNavigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [direction, setDirection] = useState(1);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prevDepth = prevPathRef.current.split("/").filter(Boolean).length;
    const currentDepth = pathname.split("/").filter(Boolean).length;
    setDirection(currentDepth < prevDepth ? -1 : 1);
    prevPathRef.current = pathname;
  }, [pathname]);

  // تعريف النوع هنا يحل مشكلة الـ TypeScript
  const pageVariants: Variants = {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      opacity: 1,
      zIndex: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 35 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (d: number) => ({
      x: d > 0 ? "-30%" : "100%",
      opacity: d > 0 ? 0 : 1,
      zIndex: d > 0 ? 0 : 2,
      transition: {
        x: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.25 },
      },
    }),
  };

  return (
    <div className="relative w-full h-[calc(100vh-102px)] overflow-hidden bg-white">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={pathname}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full bg-white flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <InitialNavigation />
    </div>
  );
}
