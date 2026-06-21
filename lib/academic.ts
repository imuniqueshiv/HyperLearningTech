import { subjects } from "./data/subjects";
import { syllabus } from "./data/syllabus";
import { pyqs } from "./data/pyqs";

export function getSubject(slug: string) {
  return subjects.find((s) => s.slug === slug);
}

export function getSubjectSyllabus(slug: string) {
  return syllabus[slug as keyof typeof syllabus];
}

export function getSubjectPYQs(slug: string) {
  return pyqs[slug as keyof typeof pyqs];
}