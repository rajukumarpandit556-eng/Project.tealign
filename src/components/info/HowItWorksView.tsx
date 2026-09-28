import React from 'react';
import {
  GraduationCap,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  Send,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

interface HowItWorksViewProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-2">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Operational Architecture</div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
          How Tealign Connects the Learning Ecosystem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          A step-by-step walkthrough of how teachers, families, and academic institutions interact on Tealign.
        </p>
      </div>

      {/* Pathway 1: Parents & Students */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">1. For Parents & Students Seeking Tutoring</h2>
            <p className="text-xs text-slate-500">From finding the right educator to successful learning milestones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 1: Multi-Filter Search</div>
            <p className="text-slate-600 text-[11px]">
              Filter by subject, grade level, home tuition vs online, and your exact preferred day & time window.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 2: Inspect Profiles</div>
            <p className="text-slate-600 text-[11px]">
              Review verified degrees, university credentials, teaching philosophy, and real ratings from other families.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 3: Send Session Request</div>
            <p className="text-slate-600 text-[11px]">
              Specify student syllabus needs and budget. The teacher reviews and accepts your requested time slot.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 4: Connect & Review</div>
            <p className="text-slate-600 text-[11px]">
              Communicate securely in-app, confirm tutor hiring, complete sessions, and leave verified academic feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Pathway 2: Teachers */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">2. For Teachers & Independent Educators</h2>
            <p className="text-xs text-slate-500">From setting your schedule to managing high-value tuition cohorts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 1: Build Profile</div>
            <p className="text-slate-600 text-[11px]">
              Highlight your degrees, teaching modes, service radius, languages, and hourly or monthly compensation fees.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 2: Set Availability</div>
            <p className="text-slate-600 text-[11px]">
              Configure custom start and end times for every day of the week, with multiple slots per day to match students.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 3: Verification</div>
            <p className="text-slate-600 text-[11px]">
              Submit graduation transcripts or teaching certificates. Gain the official verified badge to stand out.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 4: Receive Inquiries</div>
            <p className="text-slate-600 text-[11px]">
              Accept parent requests, discuss goals, or apply directly to K-12 school faculty openings.
            </p>
          </div>
        </div>
      </div>

      {/* Pathway 3: Schools & Academies */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">3. For Schools & Coaching Academies</h2>
            <p className="text-xs text-slate-500">Streamlining faculty recruitment and demo interview workflows</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 1: Post Vacancies</div>
            <p className="text-slate-600 text-[11px]">
              Specify subject, classes, compensation range, and the required weekly campus schedule.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 2: Candidate Funnel</div>
            <p className="text-slate-600 text-[11px]">
              Review applicant statements of purpose, verified credentials, and pedagogical experience.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 3: Demo Interviews</div>
            <p className="text-slate-600 text-[11px]">
              Schedule demo lectures directly with candidates with custom dates, lecture topics, and panel notes.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Step 4: Direct Hiring</div>
            <p className="text-slate-600 text-[11px]">
              Extend hiring offers, close vacancies, and build a world-class academic faculty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
