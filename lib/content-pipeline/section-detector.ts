import type { ClassifiedTextBlock } from "./block-detector";

export interface DetectedSection {
  id: string;
  pageNumber: number;
  heading: ClassifiedTextBlock | null;
  blockIds: string[];
}

/**
 * Groups classified blocks into sections using heading/title boundaries.
 * Purely structural — no subject/unit semantics.
 */
export function detectSections(
  pageNumber: number,
  orderedBlocks: ClassifiedTextBlock[]
): DetectedSection[] {
  const sections: DetectedSection[] = [];
  let current: DetectedSection | null = null;
  let sectionIndex = 0;

  function startSection(heading: ClassifiedTextBlock | null): DetectedSection {
    sectionIndex += 1;
    const section: DetectedSection = {
      id: `p${pageNumber}-section-${sectionIndex}`,
      pageNumber,
      heading,
      blockIds: heading ? [heading.id] : [],
    };
    sections.push(section);
    return section;
  }

  for (const block of orderedBlocks) {
    if (block.kind === "header" || block.kind === "footer") {
      continue;
    }

    if (
      block.kind === "heading" ||
      block.kind === "title" ||
      block.kind === "section"
    ) {
      current = startSection(block);
      continue;
    }

    if (!current) {
      current = startSection(null);
    }

    current.blockIds.push(block.id);
  }

  if (sections.length === 0) {
    return [
      {
        id: `p${pageNumber}-section-1`,
        pageNumber,
        heading: null,
        blockIds: orderedBlocks
          .filter((block) => block.kind !== "header" && block.kind !== "footer")
          .map((block) => block.id),
      },
    ];
  }

  return sections;
}
