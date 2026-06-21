export interface University {
  id: string;
  name: string;
  slug: string;
}

export interface Branch {
  id: string;
  universityId: string;
  name: string;
  slug: string;
}

export interface Semester {
  id: string;
  branchId: string;
  name: string;
  slug: string;
}

export interface Subject {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  slug: string;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
}

export interface PYQ {
  year: string;
  session: string;
  file?: string;
}