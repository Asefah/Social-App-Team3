/** Display names stored in `users.user_school` — must match backend validation. */
export const FIVE_COLLEGE_OPTIONS = [
  "UMass Amherst",
  "Amherst College",
  "Hampshire College",
  "Smith College",
  "Mount Holyoke College",
] as const;

export type FiveCollegeName = (typeof FIVE_COLLEGE_OPTIONS)[number];
