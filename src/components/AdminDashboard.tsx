/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_DEPARTMENTS, INITIAL_DEGREES } from '../data/initialData';
import { 
  Plus, Users, Briefcase, Award, ShieldAlert, CheckCircle, 
  Trash2, Mail, Shield, BookOpen, GraduationCap, ArrowUpRight, BarChart3, Lock
} from 'lucide-react';

interface AdminDashboardProps {
  currentAdmin: User;
  users: User[];
  onAddUser: (newUser: User) => void;
  onDeleteUser: (userId: string) => void;
  examsCount: number;
  attemptsCount: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  users,
  onAddUser,
  onDeleteUser,
  examsCount,
  attemptsCount
}) => {
  // Scope determination
  const isGlobalAdmin = currentAdmin.department === 'All';
  const assignedDept = currentAdmin.department;

  // Filtered users according to current admin scope
  const scopedUsers = users.filter(u => isGlobalAdmin || u.department === assignedDept);

  // Form State
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [userDept, setUserDept] = useState(isGlobalAdmin ? INITIAL_DEPARTMENTS[0] : assignedDept);
  
  // Student-specific class particulars
  const [degree, setDegree] = useState('');
  const [semester, setSemester] = useState('1st');
  const [classSection, setClassSection] = useState('Section A');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local auxiliary helper to auto-select relative degrees when department shifts
  const handleDeptChange = (dept: string) => {
    setUserDept(dept);
    const availableDegrees = INITIAL_DEGREES[dept];
    if (availableDegrees && availableDegrees.length > 0) {
      setDegree(availableDegrees[0]);
    } else {
      setDegree('');
    }
  };

  // Initialize degree selection
  React.useEffect(() => {
    const available = INITIAL_DEGREES[userDept];
    if (available && available.length > 0 && !degree) {
      setDegree(available[0]);
    }
  }, [userDept]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!userName.trim() || !userEmail.trim()) {
      setErrorMsg('Please specify both Name and Email for the new user.');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === userEmail.trim().toLowerCase())) {
      setErrorMsg('An account with this email address already exists in the registry.');
      return;
    }

    const newId = `user_${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: userName.trim(),
      email: userEmail.trim(),
      role: userRole,
      department: isGlobalAdmin ? userDept : assignedDept,
      createdAt: new Date().toISOString()
    };

    if (userRole === 'student') {
      newUser.degree = degree || 'BSCS';
      newUser.semester = semester;
      newUser.classSection = classSection;
    }

    onAddUser(newUser);

    // Reset Form
    setUserName('');
    setUserEmail('');
    setSuccessMsg(`User "${newUser.name}" successfully setup with role ${newUser.role.toUpperCase()} in ${newUser.department}!`);
    
    // Clear success message after 4s
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Aggregated Analytics
  const teacherCount = scopedUsers.filter(u => u.role === 'teacher').length;
  const studentCount = scopedUsers.filter(u => u.role === 'student').length;
  const adminCount = scopedUsers.filter(u => u.role === 'admin').length;

  // Render SVGs dynamically for statistics representation
  const departmentCounts = INITIAL_DEPARTMENTS.reduce((acc, dept) => {
    if (isGlobalAdmin || dept === assignedDept) {
      acc[dept] = users.filter(u => u.department === dept).length;
    }
    return acc;
  }, {} as Record<string, number>);

  const hasData = Object.values(departmentCounts).some(c => c > 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isGlobalAdmin ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
            {isGlobalAdmin ? 'Super Administrator Access' : 'Department Administrator Access'}
          </span>
          <h1 id="admin-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Seamless Hub & Scope Management
          </h1>
          <p className="mt-2 text-slate-500 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {isGlobalAdmin 
              ? 'Full structural overview. Onboard educators and students across all disciplines, manage standard metadata presets, and view overall server activity.' 
              : `Scoped Administrator Account for [${assignedDept}]. Under institutional rules, you are authorized to onboard and manage students and faculty within your department domain.`}
          </p>
        </div>
      </div>

      {/* Analytics Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Onboarded Teachers</span>
            <h3 id="stat-teachers" className="text-3xl font-extrabold text-slate-800 mt-1">{teacherCount}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">In Scope: {isGlobalAdmin ? 'Global' : assignedDept}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Students</span>
            <h3 id="stat-students" className="text-3xl font-extrabold text-slate-800 mt-1">{studentCount}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">In Scope: {isGlobalAdmin ? 'Global' : assignedDept}</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Exams</span>
            <h3 id="stat-exams" className="text-3xl font-extrabold text-slate-800 mt-1">{examsCount}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Institutional Total</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Submissions</span>
            <h3 id="stat-attempts" className="text-3xl font-extrabold text-slate-800 mt-1">{attemptsCount}</h3>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Awaiting & Evaluated</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Onboarding Form Panel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Onboard Institutional User
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create credentials for new educators or matriculated students.
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-100 rounded-xl flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Margaret Hamilton"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. hamilton@university.edu"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">System Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-800 cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  {!isGlobalAdmin && <option value="admin">Dept Admin</option>}
                  {isGlobalAdmin && <option value="admin">Admin</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                {isGlobalAdmin ? (
                  <select
                    value={userDept}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-800 cursor-pointer"
                  >
                    {INITIAL_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2 border border-slate-100 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{assignedDept}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Student Specific Fields */}
            {userRole === 'student' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-3.5">
                <span className="text-xs font-bold text-slate-700 tracking-wide block">Degree & Section Particulars</span>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Degree</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                  >
                    {INITIAL_DEGREES[isGlobalAdmin ? userDept : assignedDept]?.map(d => (
                      <option key={d} value={d}>{d}</option>
                    )) || <option value="BSCS">BSCS</option>}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                    >
                      {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => (
                        <option key={s} value={s}>{s} Sem</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Section</label>
                    <select
                      value={classSection}
                      onChange={(e) => setClassSection(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                    >
                      {['Section A', 'Section B', 'Section C', 'Evening Regular'].map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              id="btn-admin-submit-user"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Onboard User Account
            </button>
          </form>
        </div>

        {/* User Scope Registry Panel */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Active Users Under Scope
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isGlobalAdmin 
                  ? 'Showing all active institutional faculty and student enrollment profiles.'
                  : `Showing accounts bound strictly within the [${assignedDept}] scope.`}
              </p>
            </div>
            
            <div className="text-xs bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1.5 rounded-xl font-mono text-center">
              Total Listed: <strong className="text-slate-800">{scopedUsers.length}</strong>
            </div>
          </div>

          {/* Users Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Details</th>
                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scope Limits</th>
                    <th scope="col" className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passphrase / Credentials</th>
                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-sm">
                  {scopedUsers.map((user) => {
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${
                              user.role === 'admin' ? 'bg-amber-50 text-amber-600' :
                              user.role === 'teacher' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-indigo-50 text-indigo-600'
                            }`}>
                              {user.role === 'admin' ? <Shield className="w-4 h-4" /> :
                               user.role === 'teacher' ? <BookOpen className="w-4 h-4" /> :
                               <GraduationCap className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 line-clamp-1">{user.name}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100/50 block w-max px-2 py-0.5 rounded">
                            {user.department}
                          </span>
                          {user.role === 'student' && (
                            <span className="text-[10px] text-indigo-500 font-medium block mt-1">
                              {user.degree} • {user.semester} • {user.classSection}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-xs">
                          <span className="bg-slate-50 text-slate-400 border border-slate-100 rounded px-1.5 py-0.5" title="Standard credentials based on role designator">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {/* Disable deleting self */}
                          {user.id === currentAdmin.id ? (
                            <span className="text-xs text-slate-300 italic pr-3">Current</span>
                          ) : (
                            <button
                              onClick={() => onDeleteUser(user.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {scopedUsers.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No users found matching current scope bounds.
              </div>
            )}
          </div>

          {/* Custom SVG Distribution Chart */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3.5 flex items-center justify-between">
              <span>Scope Distribution Matrix</span>
              <span className="text-[10px] text-slate-400 normal-case font-mono">Scoped headcount metrics</span>
            </h3>

            {hasData ? (
              <div className="space-y-3">
                {Object.entries(departmentCounts).map(([dept, count]) => {
                  const maxVal = Math.max(...Object.values(departmentCounts), 1);
                  const percentage = Math.round((count / maxVal) * 100);
                  return (
                    <div key={dept}>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-slate-700">{dept}</span>
                        <span className="font-mono text-slate-500 font-bold">{count} accounts</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No active data inside registry yet.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
