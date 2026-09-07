"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "mab_portfolio_visited_pages";

export function useNavHistory() {
  const pathname = usePathname() || "/";
  const [visitedPages, setVisitedPages] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let parsed: string[] = stored ? JSON.parse(stored) : [];

      if (!Array.isArray(parsed)) {
        parsed = [];
      }

      // Add current page if not already in visited list
      if (!parsed.includes(pathname)) {
        parsed = [...parsed, pathname];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      setVisitedPages(parsed);
    } catch {
      setVisitedPages((prev) => (prev.includes(pathname) ? prev : [...prev, pathname]));
    }
    setIsHydrated(true);
  }, [pathname]);

  const isCurrent = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const isVisited = (href: string) => {
    if (!isHydrated) return false;
    return visitedPages.includes(href);
  };

  return {
    pathname,
    visitedPages,
    isHydrated,
    isCurrent,
    isVisited,
  };
}
