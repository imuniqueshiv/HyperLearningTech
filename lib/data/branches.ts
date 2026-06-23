export interface Branch {
  id: string;
  slug: string;
  name: string;
  status: "Available" | "Coming Soon";
}

export const branches: Branch[] = [
  {
    id: "common",
    slug: "common",
    name: "Common First Year",
    status: "Available",
  },
  {
    id: "aiml",
    slug: "aiml",
    name: "Artificial Intelligence & Machine Learning",
    status: "Available",
  },
  {
    id: "cse",
    slug: "cse",
    name: "Computer Science Engineering",
    status: "Available",
  },
  {
    id: "csit",
    slug: "csit",
    name: "Computer Science & Information Technology",
    status: "Available",
  },
  {
    id: "aids",
    slug: "aids",
    name: "Artificial Intelligence & Data Science",
    status: "Available",
  },
  {
    id: "csbs",
    slug: "csbs",
    name: "Computer Science & Business Systems",
    status: "Available",
  },
  {
    id: "cscy",
    slug: "cscy",
    name: "Computer Science & Cyber Security",
    status: "Available",
  },
  {
    id: "civil",
    slug: "civil",
    name: "Civil Engineering",
    status: "Available",
  },
  {
    id: "me",
    slug: "me",
    name: "Mechanical Engineering",
    status: "Available",
  },
  {
    id: "ec",
    slug: "ec",
    name: "Electronics & Communication Engineering",
    status: "Coming Soon",
  },
  {
    id: "ee",
    slug: "ee",
    name: "Electrical Engineering",
    status: "Coming Soon",
  },
  {
    id: "eee",
    slug: "eee",
    name: "Electrical & Electronics Engineering",
    status: "Coming Soon",
  },
  {
    id: "ei",
    slug: "ei",
    name: "Electronics & Instrumentation Engineering",
    status: "Coming Soon",
  },
  {
    id: "ex",
    slug: "ex",
    name: "Electronics Engineering",
    status: "Coming Soon",
  },
];
