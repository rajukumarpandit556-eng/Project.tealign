import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  Building2,
  ShieldCheck,
  Clock,
  ArrowRight,
  Star,
  CheckCircle2,
  Calendar,
  Lock,
  Sparkles,
  MapPin,
  Search
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string, extra?: any) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onSelectTeacher: (teacherId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenAuth, onSelectTeacher }) => {
  const [quickSubject, setQuickSubject] = useState('');
  const [quickGrade, setQuickGrade] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('teachers', { subject: quickSubject, grade: quickGrade });
  };

  return (
    <div className="space-y-16 pb-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_tealign_classroom_1790609472755.jpg"
            alt="Passionate educator mentoring students"
            className="w-full h-full object-cover opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-24 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 text-teal-300 border border-blue-500/40 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>The Enterprise-Grade Teacher Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-['Outfit'] max-w-3xl">
            Where Exceptional Teachers Align with Students & Schools.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Tealign eliminates matching guesswork through verified academic credentials, exact weekly availability schedule overlap, and direct hiring workflows for home tuitions, coaching institutes, and private schools.
          </p>

          {/* Quick Search Card in Hero */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 max-w-3xl flex flex-col sm:flex-row gap-2 shadow-2xl"
          >
            <div className="flex-1 bg-white rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={quickSubject}
                onChange={(e) => setQuickSubject(e.target.value)}
                placeholder="What subject? (e.g. Mathematics, Physics)"
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
            </div>

            <div className="w-full sm:w-48 bg-white rounded-xl px-3 py-2 flex items-center text-xs">
              <select
                value={quickGrade}
                onChange={(e) => setQuickGrade(e.target.value)}
                className="w-full bg-transparent text-slate-800 font-medium focus:outline-none"
              >
                <option value="">Any Grade / Level</option>
                <option value="Grade 10">Grade 10 (CBSE/ICSE)</option>
                <option value="Grade 11-12">Grade 11–12 Senior</option>
                <option value="JEE Prep">IIT-JEE / NEET Prep</option>
                <option value="IB Diploma">IB Diploma / IGCSE</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors whitespace-nowrap"
            >
              Search Teachers
            </button>
          </form>

          {/* Trust points */}
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Strict Credential Verification
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-4 h-4 text-teal-400" />
              Weekly Slot Overlap Matching
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-4 h-4 text-teal-400" />
              Safe Parent-Protected Channels
            </span>
          </div>
        </div>
      </section>

      {/* THREE-SIDED MARKETPLACE ROLES */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Built for Three Stakeholders</div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">
            Designed for Every Step of the Teaching Journey
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Teachers */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">For Professional Teachers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take control of your teaching career. Set your custom hourly fee, choose teaching modes (home tuition, coaching center, online, or school staffing), and publish your structured weekly availability calendar.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Verified credentials badge to boost parental trust</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Receive direct student tuition inquiries</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Apply for top K-12 school vacancies</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenAuth('register')}
              className="mt-4 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl transition-colors text-center"
            >
              Join as an Educator
            </button>
          </div>

          {/* Card 2: Parents & Students */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">For Parents & Students</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Find vetted mentors who match your student’s exact curriculum, learning challenges, and specific weekday/weekend hours. No more calling dozens of unverified numbers.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Search by exact required day and time window</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Home tuition or live online interactive lessons</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Safe in-app messaging without exposing personal details</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('teachers')}
              className="mt-4 w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs rounded-xl transition-colors text-center"
            >
              Find a Tutor
            </button>
          </div>

          {/* Card 3: Schools & Academies */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">For Schools & Coaching Centers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Source top faculty for board curricula, Olympiad coaching, and competitive entrance batches. Review pre-verified degrees, manage demo interview pipelines, and hire with confidence.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Post full-time, part-time, or visiting mentor openings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Candidate pipeline with demo lecture scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Access vetted master faculties from premier universities</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="mt-4 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-xs rounded-xl transition-colors text-center"
            >
              Recruit Faculty
            </button>
          </div>
        </div>
      </section>

      {/* SCHEDULE MATCHING SHOWCASE */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Structured Database Data</div>
            <h2 className="text-2xl font-bold text-slate-900 font-['Outfit'] mt-0.5">
              The Power of Relational Schedule Matching
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Unlike generic directory websites, Tealign stores every educator's weekly availability slots as normalized relational records, allowing parents and institutes to query exact matching times.
            </p>
          </div>

          <button
            onClick={() => onNavigate('teachers')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Test Live Matcher</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Weekly Schedule Demonstration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Dr. Ananya Sharma</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Verified</span>
            </div>
            <div className="text-[11px] text-slate-500">Mathematics · ₹1,200/hr</div>
            <div className="space-y-1 pt-1 font-mono text-[10px]">
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Mon: 06:30 - 08:30</div>
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Mon: 16:00 - 20:30</div>
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Wed: 16:00 - 20:30</div>
            </div>
            <button
              onClick={() => onSelectTeacher('usr_teacher_ananya')}
              className="text-[11px] text-blue-600 font-semibold hover:underline block pt-1"
            >
              View Full Availability →
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Rohit Verma</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Verified</span>
            </div>
            <div className="text-[11px] text-slate-500">Physics (IIT-JEE) · ₹1,500/hr</div>
            <div className="space-y-1 pt-1 font-mono text-[10px]">
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Tue: 17:00 - 21:00</div>
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Thu: 17:00 - 21:00</div>
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Sat: 09:00 - 16:00</div>
            </div>
            <button
              onClick={() => onSelectTeacher('usr_teacher_rohit')}
              className="text-[11px] text-blue-600 font-semibold hover:underline block pt-1"
            >
              View Full Availability →
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Sarah Jenkins</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Verified</span>
            </div>
            <div className="text-[11px] text-slate-500">English Literature & IELTS · ₹950/hr</div>
            <div className="space-y-1 pt-1 font-mono text-[10px]">
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Mon-Fri: 14:00 - 19:00</div>
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Sat: 10:00 - 13:00</div>
            </div>
            <button
              onClick={() => onSelectTeacher('usr_teacher_sarah')}
              className="text-[11px] text-blue-600 font-semibold hover:underline block pt-1"
            >
              View Full Availability →
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Karthik Subramanian</span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Reviewing</span>
            </div>
            <div className="text-[11px] text-slate-500">CS & AI · ₹850/hr</div>
            <div className="space-y-1 pt-1 font-mono text-[10px]">
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Mon: 18:00 - 21:30</div>
              <div className="bg-white p-1.5 rounded border border-blue-200 text-blue-900 font-medium">Weekend: 11:00 - 18:00</div>
            </div>
            <button
              onClick={() => onSelectTeacher('usr_teacher_karthik')}
              className="text-[11px] text-blue-600 font-semibold hover:underline block pt-1"
            >
              View Full Availability →
            </button>
          </div>
        </div>
      </section>

      {/* FINAL TRUST BANNER */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] max-w-xl mx-auto">
          Start Your Academic Journey with Tealign Today
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto leading-relaxed">
          Whether you are an educator growing your tutoring practice or a parent looking for the perfect match, our platform delivers trust, structure, and real results.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('teachers')}
            className="px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Find a Teacher Now
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 bg-blue-900/60 hover:bg-blue-900 text-white border border-white/20 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Create Free Account
          </button>
        </div>
      </section>
    </div>
  );
};
