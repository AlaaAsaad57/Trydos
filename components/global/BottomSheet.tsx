"use client";
import React, { useEffect, useRef, useState } from "react";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  height = 60,
}) {
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  const dragHandleRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const threshold = 80;
  const maxDrag =
    typeof window !== "undefined" ? window.innerHeight * 0.8 : 600;

  const handleDragStart = (clientY) => {
    setIsDragging(true);
    startY.current = clientY;
    currentY.current = 0;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  };

  const handleDrag = (clientY) => {
    if (!isDragging || !sheetRef.current) return;

    const delta = clientY - startY.current;
    const newY = Math.max(0, Math.min(maxDrag, delta));
    currentY.current = newY;

    requestAnimationFrame(() => {
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${newY}px)`;
        setTranslateY(newY);
      }
    });
  };

  const handleDragEnd = () => {
    if (!isDragging || !sheetRef.current) return;

    setIsDragging(false);
    const finalPosition = currentY.current;

    requestAnimationFrame(() => {
      if (!sheetRef.current) return;

      sheetRef.current.style.transition = "transform 0.3s ease-out";

      if (finalPosition > threshold) {
        sheetRef.current.style.transform = `translateY(${maxDrag}px)`;
        setTimeout(() => {
          setTranslateY(0);
          onClose();
        }, 300);
      } else {
        sheetRef.current.style.transform = "translateY(0)";
        setTranslateY(0);
      }
      currentY.current = 0;
    });
  };

  const handleTouchStart = (e) => {
    e.stopPropagation();
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      if (!isDragging) return;
      e.preventDefault();
      handleDrag(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    handleDrag(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!sheetRef.current) return;

    requestAnimationFrame(() => {
      if (!sheetRef.current) return;

      if (isOpen) {
        sheetRef.current.style.transition = "transform 0.3s ease-out";
        sheetRef.current.style.transform = "translateY(0)";
        setTranslateY(0);
        currentY.current = 0;
        setIsDragging(false);
      } else {
        sheetRef.current.style.transition = "transform 0.3s ease-in";
        sheetRef.current.style.transform = `translateY(${maxDrag}px)`;
      }
    });
  }, [isOpen, maxDrag]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    DisableScroll();
    return () => {
      window.removeEventListener("keydown", handleEscape);
      EnableScroll();
    };
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 m-0 z-[9999999998] bg-black/50"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-0 z-[9999999999] m-0 flex items-end justify-center transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      >
        <div
          ref={sheetRef}
          className={`w-full rounded-t-[30px] max-h-[${height}vh] bg-white p-1 sm:p-4 shadow-2xl overflow-y-auto max-w-[1365px]`}
          style={{
            willChange: "transform",
          }}
        >
          <div
            ref={dragHandleRef}
            className={`flex justify-center py-2 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
            style={{
              touchAction: "none",
            }}
          >
            <div
              className="w-[40px] h-[2px] bg-[#C4C2C2] rounded-[3px]"
              style={{
                transform: isDragging ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.2s ease-out",
              }}
            />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
