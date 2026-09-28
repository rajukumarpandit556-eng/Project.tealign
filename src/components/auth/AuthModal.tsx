import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { GraduationCap, Users, Building2, ShieldCheck, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { UserRole } from '../../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('New Delhi');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          role,
          phone,
          location,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleType: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await demoLogin(roleType);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Sign In to Tealign' : 'Create Your Tealign Account'}
      subtitle="Access verified educators, tutoring sessions, and teaching opportunities"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Quick 1-Click Demo Login Panel */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="font-semibold text-slate-700 text-[11px] mb-2 flex items-center justify-between">
            <span>Instant Demo Switcher (1-Click Test):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('teacher')}
              className="px-2 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-900 rounded-lg text-center font-medium shadow-2xs"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('student')}
              className="px-2 py-1.5 bg-white border border-teal-200 hover:bg-teal-50 text-teal-900 rounded-lg text-center font-medium shadow-2xs"
            >
              Parent
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('institute')}
              className="px-2 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-900 rounded-lg text-center font-medium shadow-2xs"
            >
              School
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="px-2 py-1.5 bg-white border border-amber-200 hover:bg-amber-50 text-amber-900 rounded-lg text-center font-medium shadow-2xs"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-slate-200 font-semibold text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              {/* Role selection pills */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  I want to join Tealign as:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'teacher', label: 'Teacher', icon: GraduationCap },
                    { id: 'student', label: 'Student / Parent', icon: Users },
                    { id: 'institute', label: 'School / Coaching', icon: Building2 },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id as UserRole)}
                        className={`p-2.5 rounded-xl border text-center font-semibold text-[11px] flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {role === 'institute' ? 'Institution / Representative Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Sharma"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. educator@example.com"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City / Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, New Delhi"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {mode === 'login' ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
