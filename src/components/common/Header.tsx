import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Bell,
  Bookmark,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Send,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenPostJob?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenAuth,
  onOpenPostJob,
}) => {
  const { user, unreadCount, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'teacher') return 'Teacher Hub';
    if (user.role === 'student') return 'Parent Hub';
    if (user.role === 'institute') return 'School Portal';
    return 'Admin Center';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element brand wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md py-1"
        >
          <span className="font-extrabold text-2xl tracking-tight text-[#0F172A] font-['Outfit']">
            Tealign<span className="text-[#2563EB]">.</span>
          </span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('teachers')}
            className={`transition-colors hover:text-slate-900 py-1 border-b-2 ${
              currentTab === 'teachers'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600'
            }`}
          >
            Find Teachers
          </button>

          <button
            onClick={() => onNavigate('jobs')}
            className={`transition-colors hover:text-slate-900 py-1 border-b-2 ${
              currentTab === 'jobs'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600'
            }`}
          >
            Teaching Jobs
          </button>

          {user?.role === 'teacher' && (
            <button
              onClick={() => onNavigate('availability')}
              className={`transition-colors hover:text-slate-900 py-1 border-b-2 ${
                currentTab === 'availability'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              My Schedule
            </button>
          )}

          <button
            onClick={() => onNavigate('how-it-works')}
            className={`transition-colors hover:text-slate-900 py-1 border-b-2 ${
              currentTab === 'how-it-works'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600'
            }`}
          >
            How It Works
          </button>

          <button
            onClick={() => onNavigate('safety')}
            className={`transition-colors hover:text-slate-900 py-1 border-b-2 ${
              currentTab === 'safety'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600'
            }`}
          >
            Trust & Safety
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Institute quick job post CTA */}
              {user.role === 'institute' && onOpenPostJob && (
                <button
                  onClick={onOpenPostJob}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Vacancy</span>
                </button>
              )}

              {/* Saved items */}
              <button
                onClick={() => onNavigate('saved')}
                className={`p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative ${
                  currentTab === 'saved' ? 'bg-slate-100 text-blue-600' : ''
                }`}
                title="Saved Teachers & Jobs"
              >
                <Bookmark className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <button
                onClick={() => onNavigate('notifications')}
                className={`p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative ${
                  currentTab === 'notifications' ? 'bg-slate-100 text-blue-600' : ''
                }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dashboard quick button */}
              <button
                onClick={() => onNavigate('dashboard')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                <span>{getDashboardLabel()}</span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden md:inline">
                    {user.full_name}
                  </span>
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 text-xs font-medium text-slate-700"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="font-semibold text-slate-900 text-sm">{user.full_name}</div>
                      <div className="text-slate-500 text-[11px] truncate">{user.email}</div>
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700">
                        {user.role}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('dashboard')}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span>{getDashboardLabel()}</span>
                    </button>

                    {user.role === 'teacher' && (
                      <>
                        <button
                          onClick={() => onNavigate('availability')}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>Availability Scheduler</span>
                        </button>
                        <button
                          onClick={() => onNavigate('requests')}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4 text-slate-500" />
                          <span>Tuition Requests</span>
                        </button>
                        <button
                          onClick={() => onNavigate('applications')}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Briefcase className="w-4 h-4 text-slate-500" />
                          <span>My Applications</span>
                        </button>
                        <button
                          onClick={() => onNavigate('verification')}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-slate-500" />
                          <span>Credential Verification</span>
                        </button>
                      </>
                    )}

                    {user.role === 'student' && (
                      <button
                        onClick={() => onNavigate('requests')}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4 text-slate-500" />
                        <span>My Tuition Requests</span>
                      </button>
                    )}

                    {user.role === 'institute' && (
                      <button
                        onClick={() => onNavigate('applications')}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Briefcase className="w-4 h-4 text-slate-500" />
                        <span>Applicant Management</span>
                      </button>
                    )}

                    {user.role === 'admin' && (
                      <button
                        onClick={() => onNavigate('admin')}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-blue-600 font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Governance Panel</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={logout}
                      className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                Join Tealign
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
