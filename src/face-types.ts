export const faces=['human','rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig'] as const;
export type Face=typeof faces[number];
export const validFace=(value:unknown):value is Face=>faces.some(face=>face===value);
