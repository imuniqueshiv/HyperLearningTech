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

  let pyqs: ProductionPyqsJson | null = input.existingPyqs;
  let pyqStats = emptyPyqStats;

  if (input.incomingPyqs) {
    const merged = mergePyqs(input.existingPyqs, input.incomingPyqs);
    pyqs = merged.pyqs;
    pyqStats = merged.stats;
  }

  let syllabus: ProductionSyllabusJson | null = input.existingSyllabus;
  let syllabusStats = emptySyllabusStats;

  if (input.incomingSyllabus) {
    const merged = mergeSyllabus(
      input.existingSyllabus,
      input.incomingSyllabus
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
