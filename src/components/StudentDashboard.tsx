/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, Exam, AnswerSubmission, ExamAttempt, QuestionGrade } from '../types';
import { 
  Plus, Clock, Play, BookOpen, CheckCircle, AlertCircle, ChevronLeft, 
  ChevronRight, ArrowRight, UserCheck, ShieldAlert, Award, FileText, BarChart3, HelpCircle
} from 'lucide-react';

interface StudentDashboardProps {
  currentStudent: User;
  exams: Exam[];
  attempts: ExamAttempt[];
  onSubmitAttempt: (newAttempt: ExamAttempt) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentStudent,
  exams,
  attempts,
  onSubmitAttempt
}) => {
  const studentDept = currentStudent.department;
  const studentDegree = currentStudent.degree || '';
  const studentSemester = currentStudent.semester || '';
  const studentSec = currentStudent.classSection || '';

  // Filter relevant assessments: must match EXACT Department, Degree, Semester and Section!
  const relevantExams = exams.filter(ex => 
    ex.department === studentDept &&
    ex.degree === studentDegree &&
    ex.semester === studentSemester &&
    ex.classSection === studentSec
  );

  // Filter attempts matching this specific student
  const studentAttempts = attempts.filter(att => att.studentId === currentStudent.id);

  // States
  type DashboardMode = 'dashboard' | 'taking_exam' | 'review_graded';
  const [mode, setMode] = useState<DashboardMode>('dashboard');
  
  // Exam playing state
  const [activePlayExam, setActivePlayExam] = useState<Exam | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, AnswerSubmission>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Reviewing single graded/under evaluation attempt state
  const [activeReviewAttempt, setActiveReviewAttempt] = useState<ExamAttempt | null>(null);
  const [activeReviewExam, setActiveReviewExam] = useState<Exam | null>(null);

  // TIMER EFFECT
  useEffect(() => {
    if (mode === 'taking_exam' && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            // Handle auto submission instantly on timeout
            handleSubmitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [mode, timerSeconds]);

  // Initiate exam process
  const startExamTaking = (exam: Exam) => {
    // Instantiate all submissions with default blank answers
    const defaultAnswers: Record<string, AnswerSubmission> = {};
    exam.questions.forEach(q => {
      if (q.type === 'mcq') {
        defaultAnswers[q.id] = { questionId: q.id, selectedOptionIndex: undefined };
      } else {
        defaultAnswers[q.id] = { questionId: q.id, textAnswer: '' };
      }
    });

    setStudentAnswers(defaultAnswers);
    setActivePlayExam(exam);
    setActiveQuestionIndex(0);
    setTimerSeconds(exam.durationMinutes * 60);
    startTimeRef.current = Date.now();
    setMode('taking_exam');
  };

  const handleMCQSelect = (qId: string, oIdx: number) => {
    setStudentAnswers({
      ...studentAnswers,
      [qId]: { questionId: qId, selectedOptionIndex: oIdx }
    });
  };

  const handleSubjectiveChange = (qId: string, text: string) => {
    setStudentAnswers({
      ...studentAnswers,
      [qId]: { questionId: qId, textAnswer: text }
    });
  };

  // Compile final submissions
  const handleSubmitExam = (isTimeoutAuto: boolean = false) => {
    if (!activePlayExam) return;

    if (!isTimeoutAuto) {
      const confirmSub = window.confirm('Are you absolutely certain you want to post your exam answers for grading?');
      if (!confirmSub) return;
    } else {
      alert('Time limit expired! Your answers have been auto-submitted.');
    }

    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Calculate grades automatically for MCQs
    // For Subjective MCQs we initialised gradedByTeacher = false and score = 0
    const calculatedGrades: QuestionGrade[] = [];
    let mcqScoreSum = 0;

    activePlayExam.questions.forEach(q => {
      const studAns = studentAnswers[q.id];
      if (q.type === 'mcq') {
        const isCorrect = studAns?.selectedOptionIndex === q.correctOptionIndex;
        const ptsEarned = isCorrect ? q.points : 0;
        mcqScoreSum += ptsEarned;
        calculatedGrades.push({
          questionId: q.id,
          score: ptsEarned,
          gradedByTeacher: true
        });
      } else {
        // subjective is NOT graded yet
        calculatedGrades.push({
          questionId: q.id,
          score: 0,
          gradedByTeacher: false
        });
      }
    });

    const isFullyMCQ = activePlayExam.questions.every(q => q.type === 'mcq');
    const totalPoints = activePlayExam.questions.reduce((sum, q) => sum + q.points, 0);

    const newAttempt: ExamAttempt = {
      id: `attempt_${Date.now()}`,
      examId: activePlayExam.id,
      examTitle: activePlayExam.title,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentClassInfo: {
        department: studentDept,
        degree: studentDegree,
        semester: studentSemester,
        classSection: studentSec
      },
      submissions: Object.values(studentAnswers),
      grades: calculatedGrades,
      totalPoints: totalPoints,
      earnedPoints: mcqScoreSum, // initially represents only MCQ portion
      isFullyGraded: isFullyMCQ, // if exams only had MCQs, it's already graded!
      startedAt: new Date(startTimeRef.current).toISOString(),
      submittedAt: new Date().toISOString(),
      timeSpentSeconds: elapsedSeconds
    };

    onSubmitAttempt(newAttempt);
    
    // Cleanup state
    setActivePlayExam(null);
    setMode('dashboard');
  };

  const handleReviewAttempt = (attempt: ExamAttempt) => {
    const examFile = exams.find(e => e.id === attempt.examId);
    setActiveReviewAttempt(attempt);
    setActiveReviewExam(examFile || null);
    setMode('review_graded');
  };

  // Timer formatting helper
  const formatTimeMinutes = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Graphics Calculations
  const gradedAttempts = studentAttempts.filter(a => a.isFullyGraded);
  const overallAvg = gradedAttempts.length > 0 
    ? Math.round((gradedAttempts.reduce((sum, current) => sum + (current.earnedPoints / current.totalPoints), 0) / gradedAttempts.length) * 100)
    : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BANNER */}
      {mode === 'dashboard' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded border border-indigo-200 uppercase tracking-widest">
              Student Assessment Workspace
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Academic Dashboard & Assessments
            </h1>
            <p className="text-xs text-slate-500">
              Department: <strong>{studentDept}</strong> • Degree: <strong>{studentDegree} ({studentSemester} Sem)</strong> • Section: <strong>{studentSec}</strong>
            </p>
          </div>
          
          <div className="flex flex-col items-start md:items-end shrink-0 md:text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Academic Achievement</span>
            <span id="stud-metric-average" className="text-2xl font-bold text-slate-900">{overallAvg}% <span className="text-xs text-slate-400 font-normal font-sans">avg</span></span>
          </div>
        </div>
      )}

      {/* DASHBOARD MODE VIEW */}
      {mode === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left: Active Assessment catalog */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Relevant Academic Assessments ({relevantExams.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing exams targeting your exact degree, class section, and semester parameters.
                </p>
              </div>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {relevantExams.map(ex => {
                  const checkAttempt = studentAttempts.find(att => att.examId === ex.id);
                  const isTaken = !!checkAttempt;

                  return (
                    <div 
                      key={ex.id} 
                      className={`p-4 border ${
                        isTaken 
                          ? 'bg-slate-50/50 border-slate-200' 
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
                      } rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                            {ex.questions.length} questions
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-slate-400" /> {ex.durationMinutes} minutes duration
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-950 text-sm">{ex.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{ex.description}</p>
                        <span className="text-[10px] text-slate-400 block font-sans">Published by: <strong className="text-slate-600">{ex.creatorName}</strong></span>
                      </div>

                      <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end gap-2.5 flex-shrink-0">
                        {isTaken ? (
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            {checkAttempt.isFullyGraded ? (
                              <>
                                <span className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  ✓ Evaluated ({checkAttempt.earnedPoints}/{checkAttempt.totalPoints})
                                </span>
                                <button
                                  onClick={() => handleReviewAttempt(checkAttempt)}
                                  id={`btn-review-${checkAttempt.id}`}
                                  className="text-indigo-600 hover:underline text-[11px] font-extrabold cursor-pointer"
                                >
                                  Review Answer Sheet
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="bg-amber-50 text-amber-700 font-bold border border-amber-100 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                  • Awaiting Evaluation
                                </span>
                                <button
                                  onClick={() => handleReviewAttempt(checkAttempt)}
                                  className="text-slate-400 hover:underline text-[11px] font-medium cursor-pointer"
                                >
                                  View My Submissions
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => startExamTaking(ex)}
                            id={`btn-start-exam-${ex.id}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md shadow-indigo-100 transition duration-150 transform active:scale-95 flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Start Exam
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {relevantExams.length === 0 && (
                  <div className="p-12 text-center text-slate-400 italic">
                    No assessments currently scheduled matching your degree/section attributes. Enjoy!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Academic History & stats timeline */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">Personal Progress Tracker</h3>
              
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Taken</span>
                  <strong className="text-xl font-bold text-slate-800 mt-1 block">{studentAttempts.length} exams</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending</span>
                  <strong className="text-xl font-bold text-slate-800 mt-1 block">{studentAttempts.filter(a => !a.isFullyGraded).length} reviews</strong>
                </div>
              </div>

              {/* Progress visual list */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Evaluations Timeline</span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {studentAttempts.map(att => {
                    const gradePct = att.totalPoints > 0 ? Math.round((att.earnedPoints / att.totalPoints) * 100) : 0;
                    return (
                      <div key={att.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/20 text-xs flex justify-between items-center">
                        <div className="truncate pr-2">
                          <strong className="text-slate-800 font-bold block truncate">{att.examTitle}</strong>
                          <span className="text-[10px] text-slate-400 block font-mono">{new Date(att.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          {att.isFullyGraded ? (
                            <span className="text-emerald-600 font-mono font-bold">{gradePct}%</span>
                          ) : (
                            <span className="text-amber-600 text-[10px] italic">Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {studentAttempts.length === 0 && (
                    <span className="text-slate-400 italic block py-4 text-center text-xs">No records available yet.</span>
                  )}
                </div>
              </div>

              {/* Progress Bar overall percentage visual */}
              {studentAttempts.length > 0 && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-900">Total Grading Efficiency</span>
                    <strong className="font-mono text-indigo-700">{overallAvg}%</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${overallAvg}%` }} />
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* EXAM PLAYER MODE (Taking exam) */}
      {mode === 'taking_exam' && activePlayExam && (
        <div className="fixed inset-0 bg-slate-900/65 z-[100] flex justify-center items-center p-4 overflow-y-auto font-sans backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh]">
            
            {/* Header: Timer and Progress */}
            <div className="bg-slate-950 p-4 sm:p-5 text-white flex justify-between items-center flex-shrink-0 select-none border-b border-slate-800">
              <div>
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/25 px-2 py-0.5 rounded font-bold uppercase tracking-widest inline-block animate-pulse">
                  ACTIVES TIMER
                </span>
                <span className="text-xs text-slate-400 ml-2 font-mono">Exam: {activePlayExam.title}</span>
              </div>
              <div className="flex items-center space-x-2 bg-red-950/40 border border-red-900/40 px-3 py-1 rounded-xl">
                <Clock className="w-4 h-4 text-red-500" />
                <span id="active-exam-timer" className="font-mono text-base font-extrabold text-red-400">
                  {formatTimeMinutes(timerSeconds)}
                </span>
              </div>
            </div>

            {/* Sub header: question slider count */}
            <div className="bg-indigo-50 border-b border-indigo-100 p-3 px-5 sm:px-6 flex justify-between items-center text-xs font-semibold text-indigo-900 flex-shrink-0 select-none">
              <span>Question {activeQuestionIndex + 1} of {activePlayExam.questions.length}</span>
              <span className="font-mono bg-white border border-indigo-100 px-2 py-0.5 rounded">
                Weight: {activePlayExam.questions[activeQuestionIndex].points} pts
              </span>
            </div>

            {/* Main content question area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              
              <div className="space-y-4">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase font-mono tracking-widest inline-block">
                  {activePlayExam.questions[activeQuestionIndex].type === 'mcq' ? 'Selective Choice' : 'Subjective response'}
                </span>
                <p id="active-question-text" className="text-slate-900 text-base font-bold leading-relaxed">
                  {activePlayExam.questions[activeQuestionIndex].text}
                </p>
              </div>

              {/* Question forms */}
              {activePlayExam.questions[activeQuestionIndex].type === 'mcq' ? (
                <div className="space-y-2.5">
                  {activePlayExam.questions[activeQuestionIndex].options?.map((option, oIdx) => {
                    const qId = activePlayExam.questions[activeQuestionIndex].id;
                    const isSelected = studentAnswers[qId]?.selectedOptionIndex === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        id={`option-${activeQuestionIndex}-${oIdx}`}
                        onClick={() => handleMCQSelect(qId, oIdx)}
                        className={`w-full text-left p-4.5 rounded-2xl border text-sm transition font-medium flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-50/50 border-indigo-500 font-bold text-indigo-900 shadow-sm' 
                            : 'bg-white border-slate-205 border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{option}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Your textual response response:</label>
                  <textarea
                    rows={6}
                    id="subjective-response-textarea"
                    placeholder="Provide a comprehensive academic answer..."
                    value={studentAnswers[activePlayExam.questions[activeQuestionIndex].id]?.textAnswer || ''}
                    onChange={(e) => handleSubjectiveChange(activePlayExam.questions[activeQuestionIndex].id, e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 leading-relaxed focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block pt-1.5 font-medium">
                    * Make sure to detail your steps logically. Plagiarism is heavily penalized.
                  </span>
                </div>
              )}
            </div>

            {/* Footer action tools */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-150 flex items-center justify-between flex-shrink-0 select-none">
              <button
                type="button"
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                className={`py-2 px-3.5 text-xs font-semibold rounded-xl border flex items-center gap-1 transition ${
                  activeQuestionIndex === 0 
                    ? 'text-slate-300 border-slate-100 bg-white cursor-not-allowed' 
                    : 'text-slate-600 border-slate-200 bg-white hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {activeQuestionIndex < activePlayExam.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                  className="py-2 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-student-finish-exam"
                  onClick={() => handleSubmitExam(false)}
                  className="py-2.5 px-5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 rounded-xl transition transform active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Finalize & Submit Paper
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REVIEW MODE VIEW (Reading student's answers & grader feedback) */}
      {mode === 'review_graded' && activeReviewAttempt && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-start flex-col sm:flex-row gap-3 border-b border-slate-100 pb-4">
            <div>
              <button
                onClick={() => { setMode('dashboard'); setActiveReviewAttempt(null); }}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center mb-3 cursor-pointer"
              >
                ← Return to Dashboard
              </button>
              <h3 className="text-xl font-bold text-slate-900">
                Evaluation Sheet: {activeReviewAttempt.examTitle}
              </h3>
              <p className="text-xs text-slate-400">
                Attempt Submitted At: <strong>{new Date(activeReviewAttempt.submittedAt).toLocaleString()}</strong>
              </p>
            </div>
            
            <div className="text-right">
              {activeReviewAttempt.isFullyGraded ? (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Overall score graded:</span>
                  <strong className="text-2xl font-black text-emerald-700 font-mono">{activeReviewAttempt.earnedPoints} / {activeReviewAttempt.totalPoints}</strong>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">Evaluation Status:</span>
                  <strong className="text-sm font-extrabold text-amber-700 animate-pulse block">Pending Review</strong>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {activeReviewAttempt.grades.map((gradeObj, qIdx) => {
              const qItem = activeReviewExam?.questions.find(q => q.id === gradeObj.questionId);
              const studSubmission = activeReviewAttempt.submissions.find(s => s.questionId === gradeObj.questionId);

              if (!qItem) return null;

              const isMcq = qItem.type === 'mcq';

              return (
                <div key={qItem.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/20 space-y-3.5">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded font-mono uppercase">
                        Q{qIdx+1} — {isMcq ? 'Multiple Choice' : 'Subjective'}
                      </span>
                      <strong className="text-slate-900 text-sm block mt-1.5 leading-relaxed">{qItem.text}</strong>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500 bg-white border border-slate-100 px-2.5 py-1 rounded">
                      Points: {gradeObj.score} / {qItem.points}
                    </span>
                  </div>

                  {/* Compare student and grading */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Your Submission:</span>
                      {isMcq ? (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                          {qItem.options?.map((opt, oIdx) => {
                            const isSelected = studSubmission?.selectedOptionIndex === oIdx;
                            const isCorrect = qItem.correctOptionIndex === oIdx;
                            return (
                              <div key={oIdx} className={`p-1.5 rounded flex justify-between items-center ${
                                isSelected && isCorrect ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100' :
                                isSelected && !isCorrect ? 'bg-red-50 text-red-800 font-bold border border-red-100' :
                                isCorrect ? 'bg-emerald-50/40 text-emerald-700 font-medium' :
                                'text-slate-500'
                              }`}>
                                <span>{opt}</span>
                                {isSelected && <span className="text-[9px] uppercase font-bold text-indigo-500">My Selection</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 min-h-[80px] whitespace-pre-wrap font-sans leading-relaxed">
                          {studSubmission?.textAnswer || <span className="text-red-500 italic">[No answer submitted]</span>}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {!isMcq ? (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 h-full">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Educator Feedback & Comments</span>
                          {gradeObj.gradedByTeacher ? (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-800 font-sans leading-relaxed italic bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-100/50">
                                "{gradeObj.feedback || 'The answer sheet has been verified. Marks have been allotted appropriately.'}"
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic font-medium pt-2">
                              Waiting for manual grading review. The evaluator will review your paper relative to standard rubrics soon.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-xl text-xs h-full flex flex-col justify-center">
                          <span className="text-emerald-800 font-bold block mb-1">✓ Instantly Audited</span>
                          <span className="text-slate-500 text-[11px] leading-relaxed">
                            Auto-evaluation engine has matched option indices. Full points are awarded on correct matching option.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => { setMode('dashboard'); setActiveReviewAttempt(null); }}
            className="py-2.5 px-6 font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs rounded-xl"
          >
            ← Return to Dashboard
          </button>
        </div>
      )}

    </div>
  );
};
