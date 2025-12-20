import "react";

declare module "react" {
  interface SVGProps<T> {
    style?: any; // ignore type checking for SVG styles globally
  }
}
declare namespace JSX {
  interface IntrinsicElements {
    svg: any;
  }
}
