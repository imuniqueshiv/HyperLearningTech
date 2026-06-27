export * from "./branches";
export * from "./subjects";
export * from "./universities";

import { subjects } from "./subjects";

export function getSubjectsBySemester(semesterId: string) {
  return subjects.filter((subject) => subject.semesterId === semesterId);
}

export function getSubject(slug: string) {
  return subjects.find((subject) => subject.slug === slug);
}
