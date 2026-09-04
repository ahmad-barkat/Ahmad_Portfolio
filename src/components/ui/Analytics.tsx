"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Log pageview for telemetry/analytics without external tracking bloat
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      console.log(`[Analytics] Pageview: ${pathname}`);
    }
  }, [pathname]);

  return null;
}
