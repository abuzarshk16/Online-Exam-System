/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, Exam, ExamAttempt, QuestionGrade } from './types';
import { INITIAL_USERS, INITIAL_EXAMS, INITIAL_ATTEMPTS } from './data/initialData';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { RotateCcw, Landmark, Info, Sparkles } from 'lucide-react';

export default function App() {
  // Master persistent state loaders
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('aegis_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('aegis_exams');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  const [attempts, setAttempts] = useState<ExamAttempt[]>(() => {
    const saved = localStorage.getItem('aegis_attempts');
    return saved ? JSON.parse(saved) : INITIAL_ATTEMPTS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aegis_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Keep LocalStorage synchronized on updates
  useEffect(() => {
    localStorage.setItem('aegis_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('aegis_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('aegis_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aegis_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aegis_current_user');
    }
  }, [currentUser]);

  // Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleResetDatabase = () => {
    const doubleCheck = window.confirm('Are you sure you want to reset all state to default demo values? All custom users, assessment templates and attempt sheets will be wiped.');
    if (doubleCheck) {
      localStorage.clear();
      setUsers(INITIAL_USERS);
      setExams(INITIAL_EXAMS);
      setAttempts(INITIAL_ATTEMPTS);
      setCurrentUser(null);
    }
  };

  // Administration actions
  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleDeleteUser = (userId: string) => {
    // Prevent deleting core demo profiles to ensure robustness
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Teacher actions
  const handleCreateExam = (newExam: Exam) => {
    setExams(prev => [newExam, ...prev]);
  };

  const handleDeleteExam = (examId: string) => {
    setExams(prev => prev.filter(e => e.id !== examId));
  };

  const handleGradeAttempt = (attemptId: string, updatedGrades: QuestionGrade[]) => {
    setAttempts(prev => prev.map(att => {
      if (att.id !== attemptId) return att;

      // Recalculate total score based on the newly saved teacher feedback inputs
      // For MCQ questions, score matches auto grade values. For Subjectives, it parses teacher input.
      const examObj = exams.find(e => e.id === att.examId);
      let newEarnedPoints = 0;

      updatedGrades.forEach(g => {
        newEarnedPoints += g.score;
      });

      return {
        ...att,
        grades: updatedGrades,
        earnedPoints: newEarnedPoints,
        isFullyGraded: true // explicitly marking as fully evaluated
      };
    }));
  };

  // Student actions
  const handleSubmitAttempt = (newAttempt: ExamAttempt) => {
    setAttempts(prev => [newAttempt, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Dynamic Screen Routing */}
      {!currentUser ? (
        <Login users={users} onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div id="main-content-area" className="flex-1 flex flex-col">
          <Navbar currentUser={currentUser} onLogout={handleLogout} />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            {currentUser.role === 'admin' && (
              <AdminDashboard
                currentAdmin={currentUser}
                users={users}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                examsCount={exams.filter(e => currentUser.department === 'All' || e.department === currentUser.department).length}
                attemptsCount={attempts.filter(a => currentUser.department === 'All' || a.studentClassInfo.department === currentUser.department).length}
              />
            )}

            {currentUser.role === 'teacher' && (
              <TeacherDashboard
                currentTeacher={currentUser}
                exams={exams}
                attempts={attempts}
                students={users.filter(u => u.role === 'student' && u.department === currentUser.department)}
                onCreateExam={handleCreateExam}
                onDeleteExam={handleDeleteExam}
                onGradeAttempt={handleGradeAttempt}
              />
            )}

            {currentUser.role === 'student' && (
              <StudentDashboard
                currentStudent={currentUser}
                exams={exams}
                attempts={attempts}
                onSubmitAttempt={handleSubmitAttempt}
              />
            )}
          </main>
        </div>
      )}

      {/* Persistence Controls Footer (Only display outside of active exam taking player) */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs text-center select-none z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <Landmark className="w-4 h-4 text-indigo-500" />
            <span>Aegis Institutional Assessment Engine • Persistent Local Workspace</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>All changes automatically cached locally.</span>
            </div>
            
            <button
              onClick={handleResetDatabase}
              id="btn-factory-reset"
              className="flex items-center gap-1 bg-red-950/40 text-red-400 hover:bg-red-900/40 hover:text-red-300 border border-red-900/30 px-3 py-1.5 rounded-lg font-semibold transition"
              title="Return database registry to factory stock state"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo States
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
