/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Exam, Question, QuestionType, ExamAttempt, QuestionGrade } from '../types';
import { INITIAL_DEGREES } from '../data/initialData';
import { 
  FileText, Plus, CheckCircle, Clock, Trash2, Eye, Award, CheckCircle2, AlertCircle, 
  Sparkles, Check, ChevronRight, BarChart3, UserCheck, Inbox, ShieldAlert
} from 'lucide-react';

interface TeacherDashboardProps {
  currentTeacher: User;
  exams: Exam[];
  attempts: ExamAttempt[];
  students: User[]; // in scope students
  onCreateExam: (newExam: Exam) => void;
  onDeleteExam: (examId: string) => void;
  onGradeAttempt: (attemptId: string, updatedGrades: QuestionGrade[]) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentTeacher,
  exams,
  attempts,
  students,
  onCreateExam,
  onDeleteExam,
  onGradeAttempt
}) => {
  const teacherDept = currentTeacher.department;

  // Filter exams created by this teacher, or matching high-level scopes
  const scopedExams = exams.filter(e => e.department === teacherDept);

  // Filter attempts corresponding to exams in teachers department
  const scopedAttempts = attempts.filter(att => att.studentClassInfo.department === teacherDept);

  // Stats
  const awaitingGradingAttempts = scopedAttempts.filter(att => !att.isFullyGraded);
  const gradedAttempts = scopedAttempts.filter(att => att.isFullyGraded);

  // Navigation tabs inside the Teacher workspace
  type ActiveTab = 'overview' | 'exams' | 'builder' | 'grading' | 'results';
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Active items for detail sub-views
  const [selectedAttemptToGrade, setSelectedAttemptToGrade] = useState<ExamAttempt | null>(null);
  const [gradingScores, setGradingScores] = useState<Record<string, { score: number; feedback: string }>>({});

  // EXAM BUILDER STATE
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examDuration, setExamDuration] = useState<number>(30);
  const [targetDegree, setTargetDegree] = useState(INITIAL_DEGREES[teacherDept]?.[0] || 'BSCS');
  const [targetSemester, setTargetSemester] = useState('4th');
  const [targetSection, setTargetSection] = useState('Section A');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [builderError, setBuilderError] = useState<string | null>(null);

  // Single Question builder draft state
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState<number>(5);
  
  // MCQ parameters
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '']);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState<number>(0);

  // Subjective parameter
  const [subjectiveRubric, setSubjectiveRubric] = useState('');

  // Auto-fill degree if dept template mounts
  React.useEffect(() => {
    const list = INITIAL_DEGREES[teacherDept];
    if (list && list.length > 0) {
      setTargetDegree(list[0]);
    }
  }, [teacherDept]);

  // Question Builders helpers
  const handleAddMCQOption = () => {
    setMcqOptions([...mcqOptions, '']);
  };

  const handleRemoveMCQOption = (index: number) => {
    if (mcqOptions.length <= 2) return; // keep minimum 2 options
    const updated = mcqOptions.filter((_, i) => i !== index);
    setMcqOptions(updated);
    if (mcqCorrectIndex >= updated.length) {
      setMcqCorrectIndex(0);
    }
  };

  const handleMCQOptionChange = (index: number, val: string) => {
    const updated = [...mcqOptions];
    updated[index] = val;
    setMcqOptions(updated);
  };

  const handleAddQuestionToDraft = () => {
    if (!qText.trim()) {
      alert('Question text cannot be empty.');
      return;
    }

    const questionId = `q_${Date.now()}`;
    const newQ: Question = {
      id: questionId,
      type: qType,
      text: qText.trim(),
      points: qPoints
    };

    if (qType === 'mcq') {
      // Validate options are populated
      if (mcqOptions.some(opt => !opt.trim())) {
        alert('Please fill out all MCQ option fields before adding.');
        return;
      }
      newQ.options = mcqOptions.map(o => o.trim());
      newQ.correctOptionIndex = mcqCorrectIndex;
    } else {
      newQ.rubricGuidelines = subjectiveRubric.trim() || 'No explicit grading rubric specified.';
    }

    setQuestions([...questions, newQ]);

    // Reset single question form
    setQText('');
    setQPoints(5);
    setMcqOptions(['', '']);
    setMcqCorrectIndex(0);
    setSubjectiveRubric('');
  };

  const handleRemoveDraftQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveExamToDatabase = () => {
    setBuilderError(null);
    if (!examTitle.trim()) {
      setBuilderError('Exam title is required.');
      return;
    }
    if (questions.length === 0) {
      setBuilderError('Please add at least one question to this assessment.');
      return;
    }

    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      title: examTitle.trim(),
      description: examDesc.trim(),
      creatorId: currentTeacher.id,
      creatorName: currentTeacher.name,
      department: teacherDept,
      degree: targetDegree,
      semester: targetSemester,
      classSection: targetSection,
      durationMinutes: examDuration,
      questions: questions,
      createdAt: new Date().toISOString()
    };

    onCreateExam(newExam);

    // Reset Entire Form
    setExamTitle('');
    setExamDesc('');
    setExamDuration(30);
    setQuestions([]);
    setActiveTab('exams');
  };

  // GRADING WORKFLOW HELPERS
  const startGradingStudent = (attempt: ExamAttempt) => {
    setSelectedAttemptToGrade(attempt);
    
    // Initialize temporary grading buffers for subjective components
    const scoresMap: Record<string, { score: number; feedback: string }> = {};
    attempt.grades.forEach(g => {
      scoresMap[g.questionId] = {
        score: g.score || 0,
        feedback: g.feedback || ''
      };
    });
    setGradingScores(scoresMap);
  };

  const handleSubjectiveScoreChange = (qId: string, value: number, maxPoints: number) => {
    const cleanVal = Math.min(Math.max(0, value), maxPoints);
    setGradingScores({
      ...gradingScores,
      [qId]: {
        ...gradingScores[qId],
        score: cleanVal
      }
    });
  };

  const handleSubjectiveFeedbackChange = (qId: string, val: string) => {
    setGradingScores({
      ...gradingScores,
      [qId]: {
        ...gradingScores[qId],
        feedback: val
      }
    });
  };

  const submitGradesFinal = () => {
    if (!selectedAttemptToGrade) return;

    // Build the final grades array, patching in the newly assessed subjective scores
    const finalGrades: QuestionGrade[] = selectedAttemptToGrade.grades.map(cg => {
      const draft = gradingScores[cg.questionId];
      if (draft) {
        return {
          questionId: cg.questionId,
          score: draft.score,
          feedback: draft.feedback,
          gradedByTeacher: true
        };
      }
      return cg;
    });

    onGradeAttempt(selectedAttemptToGrade.id, finalGrades);
    setSelectedAttemptToGrade(null);
    setGradingScores({});
    setActiveTab('grading');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded font-bold uppercase tracking-widest text-indigo-700">
            Faculty Suite
          </span>
          <h1 className="text-xl font-bold mt-2 tracking-tight text-slate-900">
            Academic Performance & Grading Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department: <strong>{teacherDept}</strong> • Manage questions, build exams, and evaluate subjective script entries.
          </p>
        </div>
        <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
          <button 
            onClick={() => { setActiveTab('builder'); setSelectedAttemptToGrade(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Build New Exam
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="border-b border-slate-200 flex flex-wrap gap-1.5 pt-2">
        <button
          onClick={() => { setActiveTab('overview'); setSelectedAttemptToGrade(null); }}
          id="tab-teacher-overview"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview' 
              ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Overview Workspace
        </button>
        <button
          onClick={() => { setActiveTab('exams'); setSelectedAttemptToGrade(null); }}
          id="tab-teacher-exams"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'exams' 
              ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          My Assessment Catalog ({scopedExams.length})
        </button>
        <button
          onClick={() => { setActiveTab('grading'); setSelectedAttemptToGrade(null); }}
          id="tab-teacher-grading"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'grading' || selectedAttemptToGrade 
              ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Grading Queue
          {awaitingGradingAttempts.length > 0 && (
            <span className="bg-red-500 text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
              {awaitingGradingAttempts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('results'); setSelectedAttemptToGrade(null); }}
          id="tab-teacher-results"
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'results' 
              ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          Historical Performance & Analytics
        </button>
      </div>

      {/* Tab Contexts */}

      {/* OVERVIEW WORKSPACE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Awaiting Grade Reviews</span>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{awaitingGradingAttempts.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Pending subjective evaluation</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Created Assessment Templates</span>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{scopedExams.length}</h3>
              <p className="text-xs text-red-500 mt-1">Bound to {teacherDept} courses</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Scope Student Registry</span>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{students.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Classroom candidates enrolled</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Quick Action Tasks */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base">Quick Access Command Tasks</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveTab('builder')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/20 text-xs font-semibold text-slate-700 flex items-center justify-between group transition-all"
                >
                  <span className="flex items-center gap-2 text-slate-800 text-sm font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Write exams targeting Degree/Class/Semester
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                <button 
                  onClick={() => setActiveTab('grading')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/20 text-xs font-semibold text-slate-700 flex items-center justify-between group transition-all"
                >
                  <span className="flex items-center gap-2 text-slate-800 text-sm font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    Evaluate student subjective responses
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>
              </div>

              {/* Roster list */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Students Under Scope ({students.length})</span>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {students.map(std => (
                    <div key={std.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50">
                      <div>
                        <strong className="text-slate-800 font-medium">{std.name}</strong>
                        <span className="text-slate-400 ml-1 font-mono">{std.email}</span>
                      </div>
                      <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold font-mono text-[10px]">
                        {std.degree} • {std.semester}
                      </span>
                    </div>
                  ))}
                  {students.length === 0 && <span className="text-slate-400 italic block py-4 text-center text-xs">No students registered in {teacherDept} yet.</span>}
                </div>
              </div>
            </div>

            {/* Department exams overview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-base">Active Assessments Under Department</h3>
                <span className="text-xs font-bold text-emerald-600">{scopedExams.length} Live Exams</span>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {scopedExams.map(ex => {
                  return (
                    <div key={ex.id} className="p-3.5 rounded-xl border border-slate-100 flex justify-between items-start text-xs relative group hover:border-emerald-100 transition-all">
                      <div className="space-y-1">
                        <strong className="text-slate-800 text-sm font-bold block">{ex.title}</strong>
                        <p className="text-slate-500 line-clamp-1">{ex.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-2 font-mono">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">Class: {ex.classSection}</span>
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{ex.degree} • {ex.semester}</span>
                          <span className="font-bold flex items-center gap-0.5"><Clock className="w-3" /> {ex.durationMinutes} mins</span>
                          <span className="font-bold text-emerald-600">QCount: {ex.questions.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {scopedExams.length === 0 && (
                  <div className="p-8 text-center text-slate-400 italic text-xs">
                    No assessments created yet. Use tab above to build one immediately!
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MY ASSESSMENT CATALOG */}
      {activeTab === 'exams' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center flex-col sm:flex-row gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Exam Template Catalog</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage existing examinations in Department of <strong>{teacherDept}</strong>.</p>
            </div>
            <button 
              onClick={() => setActiveTab('builder')}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow cursor-pointer transition-colors"
            >
              + Create Assessment Block
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scopedExams.map(ex => {
              const attemptCount = scopedAttempts.filter(att => att.examId === ex.id).length;
              return (
                <div key={ex.id} className="p-4 border border-slate-150 rounded-2xl shadow-sm relative hover:shadow-md transition-shadow flex flex-col justify-between hover:border-emerald-100">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 px-2 py-0.5 rounded">
                        {ex.degree} Semester {ex.semester}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Class: {ex.classSection}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{ex.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{ex.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ex.durationMinutes} minutes</span>
                      <span className="flex items-center gap-1 font-mono font-bold text-emerald-600 bg-emerald-50/50 px-1.5 py-0.5 rounded">{ex.questions.length} questions</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400 italic">
                      {attemptCount} Student Submission{attemptCount !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => onDeleteExam(ex.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-red-100 transition-all font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Template
                    </button>
                  </div>
                </div>
              );
            })}

            {scopedExams.length === 0 && (
              <div className="col-span-2 p-12 text-center text-slate-400">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm">No examinations templates currently exist inside this classroom scope.</p>
                <button 
                  onClick={() => setActiveTab('builder')}
                  className="mt-3 text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition"
                >
                  Create Your First Exam
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXAM BUILDER */}
      {activeTab === 'builder' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Interactive Exam Architect</h2>
            <p className="text-xs text-slate-500">Draft your instructions, add multi-type questions, and tag your specific classroom targets.</p>
          </div>

          {builderError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{builderError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: General Meta Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-1.5">Exam Target Configuration</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS201: Midterm on Recursion and Big-O"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm hover:border-slate-300 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Description / Syllabus Coverage</label>
                <textarea
                  placeholder="Provide syllabus instructions, rules on plagiarism, and tools allowable during the exam slot."
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm hover:border-slate-300 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Degree</label>
                  <select
                    value={targetDegree}
                    onChange={(e) => setTargetDegree(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
                  >
                    {INITIAL_DEGREES[teacherDept]?.map(d => (
                      <option key={d} value={d}>{d}</option>
                    )) || <option value="BSCS">BSCS</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Semester</label>
                  <select
                    value={targetSemester}
                    onChange={(e) => setTargetSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
                  >
                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => (
                      <option key={s} value={s}>{s} Sem</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Class Section</label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
                  >
                    {['Section A', 'Section B', 'Section C', 'Evening Regular'].map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Timer Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Right: Draft Questions Builder */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-1.5 flex items-center justify-between">
                <span>Add Question to Draft</span>
                <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{questions.length} Added</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQType('mcq')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                    qType === 'mcq' 
                      ? 'bg-indigo-600 text-white border-transparent' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Multiple Choice Question (MCQ)
                </button>
                <button
                  type="button"
                  onClick={() => setQType('subjective')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                    qType === 'subjective' 
                      ? 'bg-indigo-600 text-white border-transparent' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Subjective / Long Answer Choice
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Question Description</label>
                <textarea
                  rows={2}
                  placeholder="State the question explicitly..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Allotted Score Points</label>
                  <input
                    type="number"
                    min={1}
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="w-full px-3 py-1 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Conditional MCQ option arrays */}
              {qType === 'mcq' ? (
                <div className="space-y-2 border-t border-slate-200/50 pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provide Options List</span>
                    <button
                      type="button"
                      onClick={handleAddMCQOption}
                      className="text-[10px] text-indigo-600 font-extrabold hover:underline"
                    >
                      + Add Variant Option
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {mcqOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correct_choice_radio"
                          checked={mcqCorrectIndex === oIdx}
                          onChange={() => setMcqCorrectIndex(oIdx)}
                          className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Mark as Correct Answer"
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option Variant ${oIdx + 1}`}
                          value={opt}
                          onChange={(e) => handleMCQOptionChange(oIdx, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-slate-200 bg-white rounded-md text-slate-800"
                        />
                        {mcqOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMCQOption(oIdx)}
                            className="text-slate-400 hover:text-red-500 text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 italic font-medium block">
                    * The radio button selected designates the system auto-grade key.
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grading Rubric guidelines (For evaluation aid)</label>
                  <textarea
                    rows={2}
                    placeholder="Provide keywords or specific metrics a student must fulfill to get credit (shown during grading)."
                    value={subjectiveRubric}
                    onChange={(e) => setSubjectiveRubric(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800"
                  />
                </div>
              )}

              <button
                type="button"
                id="btn-teacher-add-q-draft"
                onClick={handleAddQuestionToDraft}
                className="w-full py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                + Append Question to Catalog Draft
              </button>
            </div>
          </div>

          {/* Active Questions Table draft preview */}
          {questions.length > 0 && (
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Current Question Catalog Draft ({questions.length} Items)</h3>
              <div className="divide-y divide-slate-100 space-y-3 max-h-[300px] overflow-y-auto">
                {questions.map((q, idx) => (
                  <div key={q.id} className="pt-3 flex justify-between items-start text-xs">
                    <div className="space-y-1">
                      <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded font-mono mr-1.5 uppercase tracking-wide">
                        Q{idx+1}: {q.type} ({q.points}pts)
                      </span>
                      <p className="font-semibold text-slate-800 text-sm mt-1">{q.text}</p>
                      
                      {q.type === 'mcq' ? (
                        <div className="mt-2 pl-3 border-l-2 border-slate-200">
                          {q.options?.map((o, oIdx) => (
                            <div key={oIdx} className={`py-0.5 text-slate-500 ${oIdx === q.correctOptionIndex ? 'text-emerald-600 font-bold' : ''}`}>
                              {oIdx === q.correctOptionIndex ? '✓ ' : '• '}{o}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] mt-1">Rubric: {q.rubricGuidelines}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftQuestion(idx)}
                      className="text-red-500 hover:bg-red-50 font-bold px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core submit assessment block to storage */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={() => setActiveTab('exams')}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600"
            >
              Cancel Draft
            </button>
            <button
              type="button"
              id="btn-teacher-save-exam"
              onClick={handleSaveExamToDatabase}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white shadow-md shadow-emerald-100 transition duration-150 transform active:scale-95 cursor-pointer"
            >
              Finalize & Publish Exam
            </button>
          </div>
        </div>
      )}

      {/* GRADING CENTER */}
      {(activeTab === 'grading' || selectedAttemptToGrade) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          {!selectedAttemptToGrade ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Grading Queue & Document Evaluation</h2>
                <p className="text-xs text-slate-500">Auto-scores MCQs instantly. Subjective text answers await your critical review.</p>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Candidate Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Assessment Scope</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">Submission Time</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Grading Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {scopedAttempts.map(att => {
                        return (
                          <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-800">{att.studentName}</div>
                              <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                {att.studentClassInfo.degree} Semester {att.studentClassInfo.semester}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-semibold text-slate-800 block line-clamp-1">{att.examTitle}</span>
                              <span className="text-[10px] text-indigo-500 font-mono font-bold block mt-1">Class Section: {att.studentClassInfo.classSection}</span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                              {new Date(att.submittedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {att.isFullyGraded ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Graded ({att.earnedPoints}/{att.totalPoints})
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-100 animate-pulse">
                                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600" /> Awaiting Review
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => startGradingStudent(att)}
                                id={`btn-grade-${att.id}`}
                                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm cursor-pointer"
                              >
                                {att.isFullyGraded ? 'Review Sheet' : 'Evaluate Paper'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {scopedAttempts.length === 0 && (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No candidates has attempted any evaluations in your department scope yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ACTIVE SCORING PANEL (Evaluating student paper)
            <div className="space-y-6">
              <div className="flex justify-between items-start flex-col sm:flex-row gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                    Paper Assessment Workspace
                  </span>
                  <h3 id="grading-candidate-name" className="text-xl font-bold mt-1 text-slate-900">
                    Candidate: {selectedAttemptToGrade.studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Class Scope: {selectedAttemptToGrade.studentClassInfo.degree} Sem {selectedAttemptToGrade.studentClassInfo.semester} • Section {selectedAttemptToGrade.studentClassInfo.classSection}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-mono">Exam Target:</span>
                  <strong className="text-sm font-bold text-slate-800 block">{selectedAttemptToGrade.examTitle}</strong>
                </div>
              </div>

              {/* List questions to score */}
              <div className="space-y-6">
                {selectedAttemptToGrade.grades.map((gradeObj, qIdx) => {
                  const examFile = exams.find(e => e.id === selectedAttemptToGrade.examId);
                  const qItem = examFile?.questions.find(q => q.id === gradeObj.questionId);
                  const studentSubmission = selectedAttemptToGrade.submissions.find(s => s.questionId === gradeObj.questionId);
                  
                  if (!qItem) return null;

                  const isMcq = qItem.type === 'mcq';

                  return (
                    <div key={qItem.id} className="p-5 border border-slate-150 rounded-2xl space-y-4 shadow-sm bg-slate-50/30">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                            isMcq ? 'bg-amber-100 text-amber-700' : 'bg-violet-105 bg-indigo-100 text-indigo-700'
                          }`}>
                            Q{qIdx+1} — {isMcq ? 'Multiple Choice (Auto)' : 'Subjective Writing'}
                          </span>
                          <p id={`grade-q-text-${qIdx}`} className="font-semibold text-slate-900 text-sm mt-2">{qItem.text}</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded">
                          Max Score: {qItem.points} pts
                        </span>
                      </div>

                      {/* Submissions comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100/50">
                        {/* Student Response */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Student's Submitted Answer:</span>
                          {isMcq ? (
                            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5">
                              {qItem.options?.map((opt, oIdx) => {
                                const isSelected = studentSubmission?.selectedOptionIndex === oIdx;
                                const isCorrect = qItem.correctOptionIndex === oIdx;
                                return (
                                  <div key={oIdx} className={`p-1.5 rounded flex items-center justify-between ${
                                    isSelected && isCorrect ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100' :
                                    isSelected && !isCorrect ? 'bg-red-50 text-red-800 font-bold border border-red-100' :
                                    isCorrect ? 'bg-emerald-50/40 text-emerald-700 font-medium' :
                                    'text-slate-500'
                                  }`}>
                                    <span>{opt}</span>
                                    {isSelected && <span className="text-[9px] uppercase tracking-wide bg-slate-200 px-1 py-0.2 rounded text-slate-600 font-extrabold font-sans">Selected</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 min-h-[100px] whitespace-pre-wrap leading-relaxed font-sans">
                              {studentSubmission?.textAnswer || (
                                <span className="text-red-500 italic font-mono">[No textual response was provided by the candidate]</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Grading Action & Rubric info */}
                        <div className="space-y-3">
                          {!isMcq ? (
                            <>
                              <div className="p-3 bg-indigo-50/50 border border-indigo-100 text-[11px] rounded-xl text-slate-700">
                                <strong className="text-indigo-900 block font-bold mb-1 uppercase tracking-wide">Evaluator Reference Guidelines:</strong>
                                <p className="leading-relaxed font-sans">{qItem.rubricGuidelines}</p>
                              </div>

                              <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Award Marks:</label>
                                  <div className="flex items-center space-x-1 font-semibold">
                                    <input
                                      type="number"
                                      min={0}
                                      max={qItem.points}
                                      id={`input-grade-score-${qItem.id}`}
                                      value={gradingScores[qItem.id]?.score ?? 0}
                                      onChange={(e) => handleSubjectiveScoreChange(qItem.id, Number(e.target.value), qItem.points)}
                                      className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center font-mono focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <span className="text-slate-400 font-mono">/ {qItem.points}</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Evaluator Feedback:</label>
                                  <input
                                    type="text"
                                    id={`input-grade-feedback-${qItem.id}`}
                                    placeholder="Enter feedback statement..."
                                    value={gradingScores[qItem.id]?.feedback ?? ''}
                                    onChange={(e) => handleSubjectiveFeedbackChange(qItem.id, e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 text-xs text-slate-800 rounded placeholder-slate-400"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2 h-full flex flex-col justify-center">
                              <span className="text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Automated Grading Complete
                              </span>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                                Complete score calculation matches selected student indices against configured master keys. Marks have been compiled instantly.
                              </p>
                              <div className="text-sm font-mono font-bold text-slate-700 bg-white border border-slate-100 px-3 py-1.5 rounded-lg w-max shadow-sm">
                                Score Earned: {gradeObj.score} / {qItem.points} pts
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Master grading actions */}
              <div className="pt-6 border-t border-slate-150 flex justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedAttemptToGrade(null)}
                  className="py-2.5 px-4 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Return to Queue
                </button>
                <button
                  type="button"
                  id="btn-teacher-submit-grades"
                  onClick={submitGradesFinal}
                  className="py-2.5 px-6 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 rounded-xl transition transform active:scale-95 cursor-pointer"
                >
                  Confirm & Post Academic Grade
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PERFORMANCE & ANALYTICS */}
      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Academic Scoreboards</h2>
            <p className="text-xs text-slate-500">Perform historical grade lookups and analyze class averages across semesters.</p>
          </div>

          {/* Table representing all completed exams in scope */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Student Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Exam Assessment Class</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Time Taken</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-400">Awarded Points</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-400">Efficiency Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {gradedAttempts.map(ga => {
                    const pct = ga.totalPoints > 0 ? Math.round((ga.earnedPoints / ga.totalPoints) * 100) : 0;
                    return (
                      <tr key={ga.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {ga.studentName}
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{ga.studentClassInfo.degree} Semester {ga.studentClassInfo.semester}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {ga.examTitle}
                          <span className="block text-[10px] text-indigo-500 font-bold mt-0.5">Section: {ga.studentClassInfo.classSection}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">
                          {Math.floor(ga.timeSpentSeconds / 60)}m {ga.timeSpentSeconds % 60}s
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                          {ga.earnedPoints} / {ga.totalPoints}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            pct >= 85 ? 'bg-emerald-50 text-emerald-700' :
                            pct >= 60 ? 'bg-blue-50 text-blue-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {gradedAttempts.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No finalized records match current filter coordinates yet.
              </div>
            )}
          </div>

          {/* Simple distribution graph for evaluated papers */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3.5">
              Grade Efficiency Stats - Clustered averages
            </h3>

            {gradedAttempts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Class Composite Average Marks</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1">
                    {Math.round((gradedAttempts.reduce((acc, c) => acc + (c.earnedPoints / c.totalPoints), 0) / gradedAttempts.length) * 100)}%
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Weighted against total points cataloged</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fastest Paper Completion Speed</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                    {Math.min(...gradedAttempts.map(a => Math.floor(a.timeSpentSeconds / 60)))} mins
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Reflects active student temporal metrics</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No grading analytics representable yet.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
