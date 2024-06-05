"use client";
import { FunctionComponent, useState } from "react";
import { AnimatedComponent } from "./global/AnimatedComponent";

const TestAnimation: FunctionComponent = () => {
  const [show, setShow] = useState(false);
  console.log("Show state:", show);
  return (
    <div
      className="flex items-center justify-center w-full h-full"
      data-testid="container"
    >
      <AnimatedComponent show={show}>
        <div data-testid="animation-component">I'm Here</div>
      </AnimatedComponent>
      <button
        data-testid="animation-button"
        onClick={() => {
          console.log("Button clicked");
          setShow(!show);
        }}
        type="button"
        className="bg-indigo-500 p-2 cursor-pointer"
      >
        Processing
      </button>
    </div>
  );
};

export default TestAnimation;
