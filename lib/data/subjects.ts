// lib/data/subjects.ts

export const subjects = [
  // Semester 1 - Common First Year
  {
    id: "bt-201",
    semesterId: "semester-1",
    code: "BT-201",
    name: "Engineering Physics",
    slug: "bt-201",
    branchId: "common",
  },
  {
    id: "bt-202",
    semesterId: "semester-1",
    code: "BT-202",
    name: "Mathematics-I",
    slug: "bt-202",
    branchId: "common",
  },
  {
    id: "bt-203",
    semesterId: "semester-1",
    code: "BT-203",
    name: "Basic Mechanical Engineering",
    slug: "bt-203",
    branchId: "common",
  },
  {
    id: "bt-204",
    semesterId: "semester-1",
    code: "BT-204",
    name: "Basic Civil Engineering & Mechanics",
    slug: "bt-204",
    branchId: "common",
  },
  {
    id: "bt-205",
    semesterId: "semester-1",
    code: "BT-205",
    name: "Basic Computer Engineering",
    slug: "bt-205",
    branchId: "common",
  },

  // Semester 2 - Common First Year
  {
    id: "bt-101",
    semesterId: "semester-2",
    code: "BT-101",
    name: "Engineering Chemistry",
    slug: "bt-101",
    branchId: "common",
  },
  {
    id: "bt-202-2",
    semesterId: "semester-2",
    code: "BT-202",
    name: "Mathematics-II",
    slug: "bt-202-2",
    branchId: "common",
  },
  {
    id: "bt-103",
    semesterId: "semester-2",
    code: "BT-103",
    name: "English for Communication",
    slug: "bt-103",
    branchId: "common",
  },
  {
    id: "bt-104",
    semesterId: "semester-2",
    code: "BT-104",
    name: "Basic Electrical & Electronics Engineering",
    slug: "bt-104",
    branchId: "common",
  },
  {
    id: "bt-105",
    semesterId: "semester-2",
    code: "BT-105",
    name: "Engineering Graphics",
    slug: "bt-105",
    branchId: "common",
  },
];

// Helper function to get subjects for a specific semester
export function getSubjectsBySemester(branchId: string, semesterId: string) {
  return subjects.filter(
    (subject) =>
      subject.branchId === branchId &&
      subject.semesterId === semesterId
  );
}

// Helper function to get subject by slug
export function getSubjectBySlug(slug: string) {
  return subjects.find((subject) => subject.slug === slug);
}

// Helper function to get subjects by branch
export function getSubjectsByBranch(branchId: string) {
  return subjects.filter((subject) => subject.branchId === branchId);
}