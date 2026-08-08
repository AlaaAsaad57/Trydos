"use client";

import React, { useEffect, useRef, useState } from 'react';
import { LineDragIcon } from '../icons/RdbIcons';

const DURATION_OPEN = 600; // ms
const DURATION_CLOSE = 350; // ms
const TIMING = 'cubic-bezier(0.12, 1, 0.99, 1)';

interface RdbPopUpProps {
  open: boolean;
  close: () => void;
  children: React.ReactNode;
  targetContainerId?: string;
}

export default function RdbPopUp({
  open,
  close,
  children,
  targetContainerId = 'main-app-container',
}: RdbPopUpProps) {
  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  // Full iOS Background Scale Effect
  useEffect(() => {
    let el = document.getElementById(targetContainerId);
    if (!el) {
      el = document.body;
    }
    if (!el) return;

    el.style.transition = `transform ${DURATION_OPEN}ms ${TIMING}, border-radius ${DURATION_OPEN}ms ${TIMING}`;

    if (open && !isClosing) {
      el.style.transform = 'scale(0.96)';
      el.style.transformOrigin = 'center top';
      el.style.borderRadius = '16px';
      el.style.overflow = 'hidden';
    } else {
      el.style.transform = 'scale(1)';
      el.style.borderRadius = '0px';
    }

    return () => {
      if (el) {
        el.style.transform = '';
        el.style.transition = '';
        el.style.transformOrigin = '';
        el.style.borderRadius = '';
        el.style.overflow = '';
      }
    };
  }, [open, isClosing, targetContainerId]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setIsClosing(false);
      requestAnimationFrame(() => {
        setIsOpening(true);
      });
    }
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setIsOpening(false);
    setTimeout(() => {
      setVisible(false);
      setIsClosing(false);
      setDragY(0);
      close();
    }, DURATION_CLOSE);
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      setDragY(diff);

      // Real-time drag progress: dynamically relax background scale back to 1.0
      let el = document.getElementById(targetContainerId);
      if (!el) el = document.body;
      if (el) {
        const progress = Math.min(1, diff / 300);
        const currentScale = 0.96 + progress * 0.04;
        el.style.transform = `scale(${currentScale})`;
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragY > 120) {
      handleClose();
    } else {
      setDragY(0);
      let el = document.getElementById(targetContainerId);
      if (!el) el = document.body;
      if (el && open && !isClosing) {
        el.style.transform = 'scale(0.96)';
      }
    }
  };

  const dragOpacity = isDragging ? Math.max(0, 1 - dragY / 300) : 1;

  if (!open && !visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center font-quicksand"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${(isOpening && !isClosing ? 0.4 : 0) * dragOpacity})`,
        backdropFilter: isOpening && !isClosing ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: isOpening && !isClosing ? 'blur(4px)' : 'blur(0px)',
        transition: `background-color ${isClosing ? DURATION_CLOSE : DURATION_OPEN}ms ${TIMING}, backdrop-filter ${isClosing ? DURATION_CLOSE : DURATION_OPEN}ms ${TIMING}`,
      }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[500px] h-[82vh] bg-white rounded-t-3xl border-t border-gray-200 relative overflow-hidden shadow-2xl flex flex-col will-change-transform"
        style={{
          transform: isClosing
            ? 'translateY(100%)'
            : isOpening
            ? `translateY(${dragY}px)`
            : 'translateY(100%)',
          transition: isDragging
            ? 'none'
            : `transform ${isClosing ? DURATION_CLOSE : DURATION_OPEN}ms ${TIMING}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Area */}
        <div
          className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          <LineDragIcon />
        </div>

        {/* Sheet Content */}
        <div className="flex-1 w-full overflow-y-auto min-h-0 flex flex-col items-center">
          {children}
        </div>
      </div>
    </div>
  );
}
