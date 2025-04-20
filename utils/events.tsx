// Function to generate event names
const routeEventName = (event: string) => `route-change-${event}`;

// Interface for the event detail
interface IEventDetail {
  from?: string;
  to?: string;
  data?: any;
}

// Dispatch the route change event
export const dispatchRouteChangeEvent = (
  event: "start" | "completed",
  data?: IEventDetail["data"]
) => {
  // if (event === "start") {
  //   document.documentElement.style.overflow = "hidden";
  //   document.documentElement.scrollTop = 0;
  // } else {
  //   document.documentElement.style.overflow = "initial";
  // }
  window.dispatchEvent(
    new CustomEvent(routeEventName(event), {
      bubbles: false,
      cancelable: true,
      detail: {
        ...data,
      },
    })
  );
};

// Register a listener for the route change event
export const registerRouteChangeListener = (
  event: "start" | "completed",
  fn: (data?: IEventDetail) => unknown
) => {
  window.addEventListener(
    routeEventName(event),
    (event: CustomEvent<IEventDetail>) => {
      fn(event.detail);
    }
  );
};
