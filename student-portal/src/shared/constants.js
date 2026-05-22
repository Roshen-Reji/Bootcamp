/**
 * Shared Constants
 */

export const ROLES = {
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
  STUDENT: 'student',
};

export const TASK_TYPES = {
  CORE: 'core',
  SUB: 'sub',
};

export const TASK_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

export const SUBMISSION_TYPES = {
  LINK: 'link',
  IMAGE: 'image',
  VIDEO: 'video',
  CODE: 'code',
  MULTICHOICE: 'multichoice',
};

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const BOOTCAMP_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

export const ASSIGNMENT_MODES = {
  RANDOM: 'random',
  MANUAL: 'manual',
};

export const TUTORIAL_CONTENT_TYPES = {
  LINK: 'link',
  YOUTUBE: 'youtube',
  VIDEO: 'video',
  TEXT: 'text',
};

// File upload limits
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VIDEO_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  CODE_MAX_SIZE: 1 * 1024 * 1024, // 1MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ACCEPTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ACCEPTED_CODE_EXTENSIONS: ['.js', '.py', '.java', '.c', '.cpp', '.html', '.css', '.json', '.ts', '.jsx', '.tsx'],
};

// Code editor language options
export const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
];
