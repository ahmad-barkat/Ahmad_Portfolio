"use client";

import dynamic from "next/dynamic";
import { PUBLISHED_REVIEWS } from "@/data/reviews";

// The reel and its animation library download only when there are reviews to
// show; until then the section renders nothing and costs nothing
const TestimonialsReel = dynamic(() => import("./TestimonialsReel").then((m) => m.TestimonialsReel));

export function TestimonialsSection({ background = "#072A5E" }: { background?: string }) {
  if (PUBLISHED_REVIEWS.length === 0) return null;
  return <TestimonialsReel background={background} />;
}

export default TestimonialsSection;
