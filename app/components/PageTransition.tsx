"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isExiting, setIsExiting] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setIsExiting(false);
      }, 260);
      prevPath.current = pathname;
      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  return <div className={`page-fade ${isExiting ? "is-exiting" : ""}`}>{children}</div>;
}
