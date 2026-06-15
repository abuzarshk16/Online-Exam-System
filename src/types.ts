/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string; // e.g. "Computer Science", "Electrical Engineering", "Business Admin"
  
  // Student-specific fields
  degree?: string;    // e.g. "BSCS", "BBA", "BSEE"
  semester?: string;  // e.g. "1st", "4th", "8th"
  classSection?: string; // e.g. "Section A", "Section B"
  
  createdAt: string;
}

export type QuestionType = 'mcq' | 'subjective';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  
  // MCQ-specific (optional)
  options?: string[];
  correctOptionIndex?: number; // 0-indexed correct answer
  
  // Subjective-specific (optional)
  rubricGuidelines?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  creatorId: string; // Teacher ID
  creatorName: string;
  department: string; // Auto-matched from teacher
  degree: string;     // BSCS, BBA etc. (Target)
  semester: string;   // 1st, 2nd... (Target)
  classSection: string; // Section A, Section B (Target)
  durationMinutes: number; // e.g., 60
  questions: Question[];
  createdAt: string;
}

export interface AnswerSubmission {
  questionId: string;
  selectedOptionIndex?: number; // MCQs
  textAnswer?: string;     // Subjective
}

export interface QuestionGrade {
  questionId: string;
  score: number;
  feedback?: string;
  gradedByTeacher: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentClassInfo: {
    department: string;
    degree: string;
    semester: string;
    classSection: string;
  };
  submissions: AnswerSubmission[];
  grades: QuestionGrade[]; // Per question scores
  totalPoints: number;     // Sum of exam question points
  earnedPoints: number;    // Calculated MCQ + subjective graded points
  isFullyGraded: boolean;  // False if pending subjective grading
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
}
