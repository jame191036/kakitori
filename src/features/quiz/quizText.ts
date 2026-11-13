import type { QuestionType } from '../settings/settings';

export const QUESTION_TYPE_INFO: Record<QuestionType, { label: string; example: string }> = {
  charToReading: { label: 'ดูตัวอักษร → เลือกคำอ่าน', example: 'か → ka' },
  readingToChar: { label: 'ดูคำอ่าน → เลือกตัวอักษร', example: 'ka → か' },
  audioToChar: { label: 'ฟังเสียง → เลือกตัวอักษร', example: '🔊 → か' },
  readingToWrite: { label: 'ดูคำอ่าน → เขียนตัวอักษร', example: 'ka → ✍️' },
};
