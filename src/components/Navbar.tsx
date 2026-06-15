/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, User as UserIcon, Shield, GraduationCap, Award, BookOpen } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout }) => {
  const getRoleBadgeColor = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'teacher':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'student':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'admin':
        return <Shield className="w-4 h-4 mr-1 text-amber-600" />;
      case 'teacher':
        return <BookOpen className="w-4 h-4 mr-1 text-emerald-600" />;
      case 'student':
        return <GraduationCap className="w-4 h-4 mr-1 text-indigo-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 font-sans">
                Aegis <span className="text-indigo-600 font-medium">Assess</span>
              </span>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider -mt-1.5 uppercase">
                EXAM MANAGEMENT ENGINE
              </p>
            </div>
          </div>

          {/* User Status / Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                {currentUser.name}
              </span>
              <span className="text-xs text-slate-500 max-w-[200px] truncate">
                {currentUser.email}
              </span>
            </div>

            {/* Scope / Role Badge */}
            <div className="flex flex-col gap-1 items-end sm:items-start">
              <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor()}`}>
                {getRoleIcon()}
                <span className="capitalize">{currentUser.role}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono px-1">
                Dept: {currentUser.department}
              </span>
            </div>

            {/* Quick Logout Button */}
            <button
              onClick={onLogout}
              id="btn-nav-logout"
              className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 border border-transparent hover:border-red-100"
              title="Logout from Account"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
