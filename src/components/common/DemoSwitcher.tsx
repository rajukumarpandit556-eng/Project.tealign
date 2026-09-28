import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { GraduationCap, Users, Building2, ShieldCheck, Sparkles } from 'lucide-react';

interface DemoSwitcherProps {
  onNavigate?: (tab: string) => void;
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({ onNavigate }) => {
  const { user, demoLogin, loading } = useAuth();

  const roles = [
    {
      id: 'teacher',
      label: 'Teacher',
      subtitle: 'Dr. Ananya',
      icon: GraduationCap,
      color: 'text-blue-600',
      activeBg: 'bg-blue-50 border-blue-300 text-blue-900',
    },
    {
      id: 'student',
      label: 'Parent/Student',
      subtitle: 'Priya Menon',
      icon: Users,
      color: 'text-teal-600',
      activeBg: 'bg-teal-50 border-teal-300 text-teal-900',
    },
    {
      id: 'institute',
      label: 'School/Institute',
      subtitle: 'Apex Academy',
      icon: Building2,
      color: 'text-indigo-600',
      activeBg: 'bg-indigo-50 border-indigo-300 text-indigo-900',
    },
    {
      id: 'admin',
      label: 'Admin Control',
      subtitle: 'Eleanor Vance',
      icon: ShieldCheck,
      color: 'text-amber-600',
      activeBg: 'bg-amber-50 border-amber-300 text-amber-900',
    },
  ];

  return (
    <div className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800 py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-white tracking-wide uppercase text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Switch Role Mode:
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            Experience any side of the marketplace instantly
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = user?.role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  demoLogin(r.id);
                  if (onNavigate) onNavigate('dashboard');
                }}
                disabled={loading}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all text-xs font-medium border ${
                  isActive
                    ? 'bg-white text-slate-900 border-white shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:text-white'
                }`}
                title={`Switch to ${r.label} account`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : r.color}`} />
                <span>{r.label}</span>
                <span className="text-[10px] opacity-70 hidden sm:inline">({r.subtitle})</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
