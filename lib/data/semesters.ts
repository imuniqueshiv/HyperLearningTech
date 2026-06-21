// lib/data/semesters.ts

import { branches } from "./branches";

// Define which branches have which semesters
const branchSemesterConfig = {
  common: { start: 1, end: 2, prefix: "" },
  aiml: { start: 3, end: 8, prefix: "aiml" },
  cse: { start: 3, end: 8, prefix: "cse" },
  csit: { start: 3, end: 8, prefix: "csit" },
  cy: { start: 3, end: 8, prefix: "cy" },
  ec: { start: 3, end: 8, prefix: "ec" },
  me: { start: 3, end: 8, prefix: "me" },
};

// Generate semesters programmatically
export const semesters = branches.flatMap((branch) => {
  const config = branchSemesterConfig[branch.id as keyof typeof branchSemesterConfig];
  if (!config) return [];

  const { start, end, prefix } = config;
  const branchSemesters = [];

  for (let i = start; i <= end; i++) {
    const slug = prefix ? `semester-${i}-${prefix}` : `semester-${i}`;
    branchSemesters.push({
      id: slug,
      branchId: branch.id,
      name: `Semester ${i}`,
      slug: slug,
      semesterNumber: i,
    });
  }

  return branchSemesters;
});

// Helper function to get semesters for a specific branch
export function getSemestersByBranch(branchId: string) {
  return semesters.filter((semester) => semester.branchId === branchId);
}

// Helper function to get semester by slug
export function getSemesterBySlug(slug: string) {
  return semesters.find((semester) => semester.slug === slug);
}