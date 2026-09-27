import type {
  ProductionSyllabusJson,
  ProductionSyllabusModule,
  ProductionTopic,
} from "./schema-types";
import {
  asStringArray,
  preferNonEmptyString,
  safeTrim,
} from "./string-normalize";

export interface SyllabusMergeStats {
  modulesAdded: number;
  topicsAdded: number;
}

/**
 * Merges incoming syllabus JSON into existing production syllabus JSON.
 * Preserves existing module/topic IDs. Production has modules → topics only.
 */
export function mergeSyllabus(
  existing: ProductionSyllabusJson | null,
  incoming: ProductionSyllabusJson
): { syllabus: ProductionSyllabusJson; stats: SyllabusMergeStats } {
  if (!existing) {
    return {
      syllabus: structuredClone(incoming),
      stats: countIncoming(incoming),
    };
  }

  // Repository syllabus stores topic titles as strings. That shape is
  // authoritative — do not overlay CMS object-topic modules onto it.
  if (usesRepositoryTopicShape(existing)) {
    return {
      syllabus: structuredClone(existing),
      stats: { modulesAdded: 0, topicsAdded: 0 },
    };
  }

  const stats: SyllabusMergeStats = {
    modulesAdded: 0,
    topicsAdded: 0,
  };

  const modules = [...existing.modules];

  for (const incomingModule of incoming.modules) {
    const index = modules.findIndex(
      (moduleItem) =>
        moduleItem.id === incomingModule.id ||
        moduleItem.number === incomingModule.number
    );

    if (index < 0) {
      modules.push(structuredClone(incomingModule));
      stats.modulesAdded += 1;
      stats.topicsAdded += incomingModule.topics?.length ?? 0;
      continue;
    }

    const merged = mergeModule(modules[index], incomingModule);
    modules[index] = merged.module;
    stats.topicsAdded += merged.topicsAdded;
  }

  return {
    syllabus: {
      subject: mergeSubject(existing.subject, incoming.subject),
      modules,
    },
    stats,
  };
}

function mergeSubject(
  existing: ProductionSyllabusJson["subject"],
  incoming: ProductionSyllabusJson["subject"]
): ProductionSyllabusJson["subject"] {
  return {
    id: preferNonEmptyString(existing.id, incoming.id),
    code: preferNonEmptyString(existing.code, incoming.code),
    name: preferNonEmptyString(existing.name, incoming.name),
    title: preferNonEmptyString(existing.title, incoming.title),
    university: preferNonEmptyString(existing.university, incoming.university),
    scheme: preferNonEmptyString(existing.scheme, incoming.scheme),
    semester: preferNonEmptyString(existing.semester, incoming.semester),
    credits:
      typeof existing.credits === "number" && existing.credits > 0
        ? existing.credits
        : incoming.credits,
    lectureTutorialPractical: preferNonEmptyString(
      existing.lectureTutorialPractical,
      incoming.lectureTutorialPractical
    ),
    commonTo: preferNonEmptyString(existing.commonTo, incoming.commonTo),
  };
}

function mergeModule(
  existing: ProductionSyllabusModule,
  incoming: ProductionSyllabusModule
): { module: ProductionSyllabusModule; topicsAdded: number } {
  // Repository syllabus modules store topic titles as strings. Keep that
  // authoritative shape; do not convert them into CMS topic objects.
  if (!hasObjectTopics(existing.topics)) {
    return {
      module: {
        ...existing,
        title: preferNonEmptyString(existing.title, incoming.title),
        hours:
          typeof existing.hours === "number" && existing.hours > 0
            ? existing.hours
            : incoming.hours,
        questionIds: asStringArray(existing.questionIds),
        predictedQuestionIds: asStringArray(existing.predictedQuestionIds),
      },
      topicsAdded: 0,
    };
  }

  const topics = [...existing.topics];
  let topicsAdded = 0;

  for (const incomingTopic of incoming.topics ?? []) {
    if (!incomingTopic || typeof incomingTopic !== "object") {
      continue;
    }
    const index = topics.findIndex(
      (topic) =>
        topic.id === incomingTopic.id || topic.slug === incomingTopic.slug
    );

    if (index < 0) {
      topics.push(structuredClone(incomingTopic));
      topicsAdded += 1;
      continue;
    }

    topics[index] = mergeTopic(topics[index], incomingTopic);
  }

  return {
    module: {
      id: existing.id,
      number: existing.number,
      title: preferNonEmptyString(existing.title, incoming.title),
      hours:
        typeof existing.hours === "number" && existing.hours > 0
          ? existing.hours
          : incoming.hours,
      topics,
      questionIds: unionIds(existing.questionIds, incoming.questionIds),
      predictedQuestionIds: unionIds(
        existing.predictedQuestionIds,
        incoming.predictedQuestionIds
      ),
    },
    topicsAdded,
  };
}

function mergeTopic(
  existing: ProductionTopic,
  incoming: ProductionTopic
): ProductionTopic {
  return {
    id: existing.id,
    slug: preferNonEmptyString(existing.slug, incoming.slug),
    title: preferNonEmptyString(existing.title, incoming.title),
    displayOrder:
      typeof existing.displayOrder === "number" && existing.displayOrder > 0
        ? existing.displayOrder
        : incoming.displayOrder,
  };
}

function countIncoming(syllabus: ProductionSyllabusJson): SyllabusMergeStats {
  return {
    modulesAdded: syllabus.modules.length,
    topicsAdded: syllabus.modules.reduce(
      (sum, moduleItem) => sum + (moduleItem.topics?.length ?? 0),
      0
    ),
  };
}

function unionIds(existing: unknown, incoming: unknown): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of [...asStringArray(existing), ...asStringArray(incoming)]) {
    const trimmed = safeTrim(id);
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function hasObjectTopics(topics: unknown): topics is ProductionTopic[] {
  return (
    Array.isArray(topics) &&
    topics.length > 0 &&
    topics.every((topic) => topic !== null && typeof topic === "object")
  );
}

function usesRepositoryTopicShape(syllabus: ProductionSyllabusJson): boolean {
  return syllabus.modules.some((moduleItem) => {
    const topics = moduleItem.topics as unknown;
    return (
      Array.isArray(topics) && topics.some((topic) => typeof topic === "string")
    );
  });
}
