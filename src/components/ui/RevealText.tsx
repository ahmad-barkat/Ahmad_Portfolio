import React from "react";

/**
 * Text split into words, each in its own mask, for a line-by-line reveal:
 * an entrance timeline slides every `.rw-i` up from below its `.rw` mask.
 * Nested elements (an <em>, a <b>) keep their tag and have their own words
 * split inside them. The spaces stay between the words, so the text still
 * reads, copies and wraps as normal.
 */
export function RevealText({ children }: { children: React.ReactNode }) {
  return <>{split(children, "rt")}</>;
}

function split(node: React.ReactNode, key: string): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    const parts = String(node).split(/(\s+)/);
    return parts.map((part, i) =>
      /^\s+$/.test(part) || part === "" ? (
        part
      ) : (
        <span key={`${key}-${i}`} className="rw">
          <span className="rw-i">{part}</span>
        </span>
      ),
    );
  }
  if (Array.isArray(node)) return node.map((child, i) => split(child, `${key}-${i}`));
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children === undefined) return node;
    return React.cloneElement(node, { key } as React.Attributes, split(props.children, `${key}-c`));
  }
  return node;
}

export default RevealText;
