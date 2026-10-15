"use client";

import dynamic from "next/dynamic";
import { PUBLISHED_REVIEWS } from "@/data/reviews";

// The cards download only when there are reviews to show; until then the
// section renders nothing and costs nothing
const TestimonialsGrid = dynamic(() => import("./TestimonialsGrid").then((m) => m.TestimonialsGrid));

export function TestimonialsSection({ background = "#072A5E" }: { background?: string }) {
  if (PUBLISHED_REVIEWS.length === 0) return null;
  return <TestimonialsGrid background={background} />;
}

export default TestimonialsSection;
