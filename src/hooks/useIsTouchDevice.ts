import { useEffect, useState } from "react";

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
        "ontouchstart" in window,
    );
  }, []);

  return isTouch;
}
