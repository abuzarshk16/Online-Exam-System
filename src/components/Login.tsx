/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, GraduationCap, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Guard empty values
    if (!email.trim()) {
      setError('Please provide a valid email identifier.');
      return;
    }

    // Since this is a self-contained high-fidelity evaluation prototype,
    // we match from our existing users list. All standard users can be accessed
    // with password "admin" for admins, "teacher" for teachers, and "student" for students.
    const cleanEmail = email.trim().toLowerCase();
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      setError('No user account corresponds to this email address.');
      return;
    }

    // Verify simple matching credentials
    const expectedPassword = matchedUser.role; // 'admin', 'teacher', or 'student'. All newly created get password of their role name.
    
    // Allow standard passwords or just direct match if the user is testing
    if (password.trim().toLowerCase() !== expectedPassword && password.trim() !== 'password123' && password.trim() !== 'admin') {
      setError(`Incorrect creds for ${matchedUser.role}. Demo password for ${matchedUser.role} is: "${expectedPassword}"`);
      return;
    }

    onLoginSuccess(matchedUser);
  };

  const handleQuickLogin = (demoEmail: string, rolePassword: string) => {
    setEmail(demoEmail);
    setPassword(rolePassword);
    
    const matched = users.find(u => u.email.toLowerCase() === demoEmail.toLowerCase());
    if (matched) {
      onLoginSuccess(matched);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">E</div>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-800">
          Online Exam Portal
        </h2>
        <p className="mt-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Secure Examination & Analytics System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleLoginSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-start space-x-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@exam.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm transition-all duration-155"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-indigo-600 font-medium font-mono">
                  Same as user's role (e.g. admin / teacher / student)
                </span>
              </div>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm transition-all duration-155"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                id="btn-login"
                className="w-full h-11 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                Sign In to Dashboard
              </button>
            </div>
          </form>

          {/* Prompt warning about sandbox */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400 gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Interactive sandbox: click below for simulation logins</span>
          </div>

          {/* Quick login grid */}
          <div className="mt-4 space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
              Super Admin Control
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="login-quick-admin-global"
                onClick={() => handleQuickLogin('admin@exam.com', 'admin')}
                className="flex items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800">Global Admin</div>
                  <div className="text-[10px] text-slate-400 truncate">admin@exam.com</div>
                </div>
              </button>

              <button
                type="button"
                id="login-quick-admin-cs"
                onClick={() => handleQuickLogin('cs_admin@exam.com', 'admin')}
                className="flex items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800">CS Admin</div>
                  <div className="text-[10px] text-slate-400 truncate">cs_admin@exam.com</div>
                </div>
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center pt-2">
              Teacher Dashboards (Scoped Department)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="login-quick-teacher-cs"
                onClick={() => handleQuickLogin('cs_teacher@exam.com', 'teacher')}
                className="flex items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800 font-sans">CS: Dr. Sarah</div>
                  <div className="text-[10px] text-slate-400 truncate">cs_teacher@exam.com</div>
                </div>
              </button>

              <button
                type="button"
                id="login-quick-teacher-biz"
                onClick={() => handleQuickLogin('biz_teacher@exam.com', 'teacher')}
                className="flex items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800 font-sans">Biz: Prof. Alex</div>
                  <div className="text-[10px] text-slate-400 truncate">biz_teacher@exam.com</div>
                </div>
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center pt-2">
              Student Assessment Entry
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="login-quick-student-jane"
                onClick={() => handleQuickLogin('jane_student@exam.com', 'student')}
                className="flex items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800 font-sans">Jane (CS)</div>
                  <div className="text-[10px] text-slate-400 truncate">jane_student@exam.com</div>
                </div>
              </button>

              <button
                type="button"
                id="login-quick-student-john"
                onClick={() => handleQuickLogin('john_student@exam.com', 'student')}
                className="flex items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-800 font-sans">John (Business)</div>
                  <div className="text-[10px] text-slate-400 truncate">john_student@exam.com</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
