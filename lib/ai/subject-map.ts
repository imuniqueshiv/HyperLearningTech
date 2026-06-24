import { SubjectInfo } from "@/types/ai";

export const SUBJECT_MAP: Record<string, SubjectInfo> = {
  "BT-101": {
    code: "BT-101",
    name: "Engineering Chemistry",
    type: "CHEMISTRY",
  },

  "BT-202": {
    code: "BT-202",
    name: "Mathematics-II",
    type: "MATH",
  },
};

export function getSubjectInfo(subjectCode: string): SubjectInfo {
  return (
    SUBJECT_MAP[subjectCode] || {
      code: subjectCode,
      name: "General Engineering",
      type: "GENERAL",
    }
  );
}
