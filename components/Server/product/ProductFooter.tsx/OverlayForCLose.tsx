"use client";
export const OverlayForClose = ({ close }) => {
  return (
    <div
      onClick={() => close()}
      className="absolute z-99999999999 bottom-full bg-[rgba(0,0,0,0.2)] left-0 w-full h-screen"
      data-cy="close_extended_area"
    />
  );
};
