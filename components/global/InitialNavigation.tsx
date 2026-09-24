import { useEffect } from "react";
import { useAppStore } from "store";

function InitialNavigation() {
  const { setIsNavigating } = useAppStore();
  useEffect(() => {
    setIsNavigating(false);
  }, []);
  return null;
}

export default InitialNavigation;
