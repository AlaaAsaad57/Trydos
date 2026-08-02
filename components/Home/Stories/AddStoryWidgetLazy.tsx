"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { useAppStore } from "store";
import AddStorySkeleton from "components/skeleton/AddStorySkeleton";

// Lazy: AddStoryWidget statically imports react-webcam (CameraStory) and
// react-image-crop (ImageCropWidget); a static import would ship both in the
// home-page bundle even though the widget only appears after tapping "+".
const AddStoryWidget = dynamic(() => import("./AddStoryWidget"), {
  ssr: false,
  loading: () => <AddStorySkeleton />,
});

// Mounts the widget on first enable and keeps it mounted afterwards, so the
// widget's own addStoryEnable gate and its scroll-lock effect cleanup keep
// behaving exactly as with a static import (it renders nothing when disabled).
export default function AddStoryWidgetLazy() {
  const addStoryEnable = useAppStore((s) => s.addStoryEnable);
  const everEnabled = useRef(false);
  if (addStoryEnable) everEnabled.current = true;
  if (!everEnabled.current) return null;
  return <AddStoryWidget />;
}
