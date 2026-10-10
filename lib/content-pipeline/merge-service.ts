import { mergePyqs, type PyqMergeStats } from "./pyq-merger";
import { mergeSyllabus, type SyllabusMergeStats } from "./syllabus-merger";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
} from "./schema-types";

export interface MergeResult {
  pyqs: ProductionPyqsJson | null;
  syllabus: ProductionSyllabusJson | null;
  pyqStats: PyqMergeStats;
  syllabusStats: SyllabusMergeStats;
}

/**
 * Orchestrates PYQ and syllabus merges independently.
 * Callers must treat returned objects as owned copies — existing content
 * is never mutated by reference.
 */
export function mergeProductionContent(input: {
  existingPyqs: ProductionPyqsJson | null;
  incomingPyqs: ProductionPyqsJson | null;
  existingSyllabus: ProductionSyllabusJson | null;
  incomingSyllabus: ProductionSyllabusJson | null;
}): MergeResult {
  const emptyPyqStats: PyqMergeStats = {
    papersAdded: 0,
    questionsAdded: 0,
    subQuestionsAdded: 0,
    attachmentsAdded: 0,
  };

  const emptySyllabusStats: SyllabusMergeStats = {
    modulesAdded: 0,
    topicsAdded: 0,
  };

  let pyqs: ProductionPyqsJson | null = null;
  let pyqStats = emptyPyqStats;

  if (input.incomingPyqs) {
    const merged = mergePyqs(
      input.existingPyqs ? structuredClone(input.existingPyqs) : null,
      structuredClone(input.incomingPyqs)
    );
    pyqs = merged.pyqs;
    pyqStats = merged.stats;
  } else if (input.existingPyqs) {
    pyqs = structuredClone(input.existingPyqs);
  }

  // PYQ-only imports must not produce a syllabus merge candidate.
  // Returning existingSyllabus previously caused pending-syllabus.json
  // writes and false "topics modified" diffs during PYQ review/save.
  let syllabus: ProductionSyllabusJson | null = null;
  let syllabusStats = emptySyllabusStats;

  if (input.incomingSyllabus) {
    const merged = mergeSyllabus(
      input.existingSyllabus ? structuredClone(input.existingSyllabus) : null,
      structuredClone(input.incomingSyllabus)
    );
    syllabus = merged.syllabus;
    syllabusStats = merged.stats;
  }

  return {
    pyqs,
    syllabus,
    pyqStats,
    syllabusStats,
  };
}
