import { useEffect, useState } from "react";

export function useAdminViewport(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}
