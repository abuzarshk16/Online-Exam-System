/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Exam, ExamAttempt } from '../types';

export const INITIAL_DEPARTMENTS = [
  'Computer Science',
  'Business Administration',
  'Electrical Engineering',
  'Mechanical Engineering'
];

export const INITIAL_DEGREES: Record<string, string[]> = {
  'Computer Science': ['BSCS', 'MSCS', 'BS Software Engineering'],
  'Business Administration': ['BBA', 'MBA', 'BS Accounting & Finance'],
  'Electrical Engineering': ['BSEE', 'MSEE'],
  'Mechanical Engineering': ['BSME']
};

export const INITIAL_USERS: User[] = [
  // Super Admins
  {
    id: 'admin_1',
    name: 'Super Administrator',
    email: 'admin@exam.com',
    role: 'admin',
    department: 'All', // Global scope
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'admin_cs',
    name: 'CS Dept Admin',
    email: 'cs_admin@exam.com',
    role: 'admin',
    department: 'Computer Science', // Department-specific Admin scope
    createdAt: '2026-02-15T11:00:00Z'
  },
  
  // Teachers
  {
    id: 'teacher_cs',
    name: 'Dr. Sarah Jenkins',
    email: 'cs_teacher@exam.com',
    role: 'teacher',
    department: 'Computer Science',
    createdAt: '2026-03-01T09:00:00Z'
  },
  {
    id: 'teacher_biz',
    name: 'Prof. Alex Mercer',
    email: 'biz_teacher@exam.com',
    role: 'teacher',
    department: 'Business Administration',
    createdAt: '2026-03-05T09:30:00Z'
  },
  
  // Students
  {
    id: 'student_jane',
    name: 'Jane Doe',
    email: 'jane_student@exam.com',
    role: 'student',
    department: 'Computer Science',
    degree: 'BSCS',
    semester: '4th',
    classSection: 'Section A',
    createdAt: '2026-03-10T08:00:00Z'
  },
  {
    id: 'student_john',
    name: 'John Smith',
    email: 'john_student@exam.com',
    role: 'student',
    department: 'Business Administration',
    degree: 'BBA',
    semester: '2nd',
    classSection: 'Section B',
    createdAt: '2026-03-11T08:30:00Z'
  },
  {
    id: 'student_bob',
    name: 'Bob Carter',
    email: 'bob_student@exam.com',
    role: 'student',
    department: 'Computer Science',
    degree: 'BSCS',
    semester: '4th',
    classSection: 'Section B', // Different class section to demonstrate targeting
    createdAt: '2026-03-12T10:00:00Z'
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam_dsa_mid',
    title: 'Data Structures & Algorithms - Midterm',
    description: 'Covers trees, lists, stacks, queues, and complexity analysis (Big-O).',
    creatorId: 'teacher_cs',
    creatorName: 'Dr. Sarah Jenkins',
    department: 'Computer Science',
    degree: 'BSCS',
    semester: '4th',
    classSection: 'Section A',
    durationMinutes: 15,
    createdAt: '2026-06-01T14:00:00Z',
    questions: [
      {
        id: 'q_dsa_1',
        type: 'mcq',
        text: 'What is the tightest worst-case time complexity of searching for an element in a perfectly balanced Binary Search Tree containing N nodes?',
        points: 5,
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctOptionIndex: 1
      },
      {
        id: 'q_dsa_2',
        type: 'mcq',
        text: 'Which of the following abstract data structures follows the Last In First Out (LIFO) protocol?',
        points: 5,
        options: ['Queue', 'Double-ended Queue', 'Stack', 'Min-Heap'],
        correctOptionIndex: 2
      },
      {
        id: 'q_dsa_3',
        type: 'subjective',
        text: 'Explain the technical differences between a Stack and a Queue. Provide a detailed, practical real-world software engineering application for each.',
        points: 10,
        rubricGuidelines: '5 points for correct contrast (LIFO vs. FIFO, pointer differences). 2.5 points for stack example (e.g., undo/redo operation list, compiler call stack). 2.5 points for queue example (e.g., printer print spooler, event loop macro-task queue).'
      }
    ]
  },
  {
    id: 'exam_accounting',
    title: 'Introduction to Accounting & Finance',
    description: 'An evaluation on financial statement mechanics, accrual balances, and liquidity analysis.',
    creatorId: 'teacher_biz',
    creatorName: 'Prof. Alex Mercer',
    department: 'Business Administration',
    degree: 'BBA',
    semester: '2nd',
    classSection: 'Section B',
    durationMinutes: 20,
    createdAt: '2026-06-02T10:00:00Z',
    questions: [
      {
        id: 'q_acc_1',
        type: 'mcq',
        text: 'What is the fundamental accounting equation that governs balance sheet mechanics?',
        points: 5,
        options: [
          'Assets = Liabilities + Equity',
          'Liabilities = Assets + Equity',
          'Equity = Assets + Liabilities',
          'Assets = Revenue - Expenses'
        ],
        correctOptionIndex: 0
      },
      {
        id: 'q_acc_2',
        type: 'subjective',
        text: 'Discuss why a business can operate at a high net profit on its income statement but run into severe liquidity shortage or bankruptcy. Point specifically to differences in revenue/expense timing.',
        points: 15,
        rubricGuidelines: '7 points for contrasting accrual accounting vs cash accounting. 8 points for explaining balance sheet inventory/accounts receivable timing differences (e.g., sales on credit vs cash receipts, capital expenditure outflows).'
      }
    ]
  },
  {
    id: 'exam_programming_basic',
    title: 'Intro to Computer Programming quiz',
    description: 'Basic syntax, control constructs, and functions in procedural programming.',
    creatorId: 'teacher_cs',
    creatorName: 'Dr. Sarah Jenkins',
    department: 'Computer Science',
    degree: 'BSCS',
    semester: '4th',
    classSection: 'Section A',
    durationMinutes: 10,
    createdAt: '2026-05-20T08:00:00Z',
    questions: [
      {
        id: 'q_prog_1',
        type: 'mcq',
        text: 'What does a variable declared with "const" signify in modern JavaScript/TypeScript?',
        points: 5,
        options: [
          'It is completely immutable in all aspects (even object keys cannot change)',
          'Its binding is read-only and cannot be reassigned',
          'It is allocated dynamically on the machine register',
          'It can only hold binary integer sequences'
        ],
        correctOptionIndex: 1
      },
      {
        id: 'q_prog_2',
        type: 'mcq',
        text: 'Which operator represents structured strict equality checks in type-secure JavaScript/TypeScript?',
        points: 5,
        options: ['==', '=', '===', 'equals()'],
        correctOptionIndex: 2
      }
    ]
  }
];

export const INITIAL_ATTEMPTS: ExamAttempt[] = [
  // A previous fully graded exam by Jane to show historical stats
  {
    id: 'history_attempt_1',
    examId: 'exam_programming_basic',
    examTitle: 'Intro to Computer Programming quiz',
    studentId: 'student_jane',
    studentName: 'Jane Doe',
    studentClassInfo: {
      department: 'Computer Science',
      degree: 'BSCS',
      semester: '4th',
      classSection: 'Section A'
    },
    submissions: [
      { questionId: 'q_prog_1', selectedOptionIndex: 1 },
      { questionId: 'q_prog_2', selectedOptionIndex: 2 }
    ],
    grades: [
      { questionId: 'q_prog_1', score: 5, gradedByTeacher: true },
      { questionId: 'q_prog_2', score: 5, gradedByTeacher: true }
    ],
    totalPoints: 10,
    earnedPoints: 10,
    isFullyGraded: true,
    startedAt: '2026-05-25T09:00:00Z',
    submittedAt: '2026-05-25T09:08:30Z',
    timeSpentSeconds: 510
  },
  
  // An active submitted exam of Jane Doe waiting for subjective grading on DSA
  {
    id: 'active_attempt_jane_dsa',
    examId: 'exam_dsa_mid',
    examTitle: 'Data Structures & Algorithms - Midterm',
    studentId: 'student_jane',
    studentName: 'Jane Doe',
    studentClassInfo: {
      department: 'Computer Science',
      degree: 'BSCS',
      semester: '4th',
      classSection: 'Section A'
    },
    submissions: [
      { questionId: 'q_dsa_1', selectedOptionIndex: 1 }, // Correct!
      { questionId: 'q_dsa_2', selectedOptionIndex: 0 }, // Incorrect! Correct was 2 (Stack)
      { 
        questionId: 'q_dsa_3', 
        textAnswer: 'A stack is Last In First Out (LIFO), whereas a queue is First In First Out (FIFO). In a stack/queue pointer insertions happen differently - stack push/pop are at the top, queue enqueue at tail, dequeue at head. \nAn example of a stack application is the "Undo/Redo" feature in a text editor like VSCode, where edits are pushed on a stack and popped when Ctrl+Z is triggered. \nAn example of a queue application is a printer spooler queue, where files to print are processed strictly in the order they were received.' 
      }
    ],
    grades: [
      { questionId: 'q_dsa_1', score: 5, gradedByTeacher: true }, // Auto-graded MCQ
      { questionId: 'q_dsa_2', score: 0, gradedByTeacher: true }, // Auto-graded MCQ
      { questionId: 'q_dsa_3', score: 0, gradedByTeacher: false } // Subjective - awaiting teacher evaluation!
    ],
    totalPoints: 20,
    earnedPoints: 5, // currently only MCQ correct points
    isFullyGraded: false,
    startedAt: '2026-06-14T10:00:00Z',
    submittedAt: '2026-06-14T10:14:15Z',
    timeSpentSeconds: 855
  }
];
