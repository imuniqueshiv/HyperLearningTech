import fs from "fs/promises";
import type { Topic } from "@/types/topic";
import {
  getRgpvContentRoot,
  getRgpvSubjectFile,
} from "@/lib/content/rgpv-paths";

export async function getSyllabus(
  branch: string,
  semester: string,
  subjectCode: string
) {
  try {
    const baseDir = getRgpvContentRoot();
    const filePath = getRgpvSubjectFile(
      branch,
      semester,
      subjectCode,
      "syllabus.json"
    );

    if (!filePath.startsWith(baseDir)) {
      throw new Error("Invalid path parameter");
    }

    const file = await fs.readFile(
      /* turbopackIgnore: true */ filePath,
      "utf8"
    );

    return JSON.parse(file);
  } catch (error) {
    console.error(
      `Failed to load syllabus for ${branch}/${semester}/${subjectCode}`,
      error
    );

    return null;
  }
}

export async function getPYQs(
  branch: string,
  semester: string,
  subjectCode: string
) {
  try {
    const baseDir = getRgpvContentRoot();
    const filePath = getRgpvSubjectFile(
      branch,
      semester,
      subjectCode,
      "pyqs.json"
    );

    if (!filePath.startsWith(baseDir)) {
      throw new Error("Invalid path parameter");
    }

    const file = await fs.readFile(
      /* turbopackIgnore: true */ filePath,
      "utf8"
    );

    return JSON.parse(file);
  } catch (error) {
    console.error(
      `Failed to load PYQs for ${branch}/${semester}/${subjectCode}`,
      error
    );

    return null;
  }
}
interface SyllabusModule {
  id: string;
  number: number;
  title: string;
  hours: number;
  topics?: Topic[];
}

export interface TopicLookupResult {
  topic: Topic;
  module: {
    id: string;
    number: number;
    title: string;
  };
}
export async function getTopicById(
  branch: string,
  semester: string,
  subjectCode: string,
  topicId: string
): Promise<TopicLookupResult | null> {
  const syllabus = await getSyllabus(branch, semester, subjectCode);

  if (!syllabus) {
    return null;
  }

  const modules = (syllabus.modules ?? []) as SyllabusModule[];

  for (const syllabusModule of modules) {
    const topics = syllabusModule.topics ?? [];

    const topic = topics.find((item) => {
      if (typeof item === "string") {
        return item === topicId;
      }
      return (item as { id: string }).id === topicId;
    });

    if (topic) {
      const topicObj =
        typeof topic === "string"
          ? ({ id: topic, title: topic, slug: topic, displayOrder: 0 } as Topic)
          : (topic as Topic);

      return {
        topic: topicObj,
        module: {
          id: syllabusModule.id,
          number: syllabusModule.number,
          title: syllabusModule.title,
        },
      };
    }
  }

  return null;
}
