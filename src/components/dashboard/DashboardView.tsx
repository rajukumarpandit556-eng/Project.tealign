import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  GraduationCap,
  Users,
  Building2,
  Calendar,
  Send,
  Briefcase,
  ShieldCheck,
  Star,
  PlusCircle,
  Clock,
  ArrowRight,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import { AdminDashboard } from '../admin/AdminDashboard.tsx';
import { ScheduleViewer } from '../common/ScheduleViewer.tsx';

interface DashboardViewProps {
  onNavigate: (tab: string, extra?: any) => void;
  onOpenPostJob?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenPostJob }) => {
  const { user, profile } = useAuth();
  const [teacherAvailability, setTeacherAvailability] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [instituteJobs, setInstituteJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'teacher') {
        const [availRes, reqRes] = await Promise.all([
          api.getTeacherAvailability(),
          api.getTeacherRequests(),
        ]);
        setTeacherAvailability(availRes.slots || []);
        setRecentRequests(reqRes.requests || []);
      } else if (user.role === 'student') {
        const reqRes = await api.getStudentRequests();
        setRecentRequests(reqRes.requests || []);
      } else if (user.role === 'institute') {
        const jobsRes = await api.getMyInstituteJobs();
        setInstituteJobs(jobsRes.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // ==========================================
  // TEACHER DASHBOARD
  // ==========================================
  if (user?.role === 'teacher') {
    const isVerified = user.is_verified || profile?.verification_status === 'verified';
    const pendingRequestsCount = recentRequests.filter((r) => r.status === 'pending').length;

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user.full_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
                  Welcome back, {user.full_name}
                </h2>
                {isVerified && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Educator
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.title || 'Senior Academic Educator'} · Hourly Rate: ₹{profile?.hourly_rate || 1000}/hr
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onNavigate('availability')}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Edit Weekly Schedule</span>
            </button>
            <button
              onClick={() => onNavigate('requests')}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors relative"
            >
              <Send className="w-4 h-4" />
              <span>Tuition Inquiries</span>
              {pendingRequestsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Average Rating</div>
            <div className="text-2xl font-black text-amber-500 tabular-nums mt-1 font-['Outfit'] flex items-center gap-1">
              <Star className="w-6 h-6 fill-current" />
              <span>{Number(profile?.rating_avg || 5.0).toFixed(1)}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Based on {profile?.review_count || 0} verified reviews
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Tuition Requests</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums mt-1 font-['Outfit']">
              {recentRequests.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {pendingRequestsCount} awaiting your reply
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Active Days / Week</div>
            <div className="text-2xl font-black text-blue-600 tabular-nums mt-1 font-['Outfit']">
              {new Set(teacherAvailability.map((s) => s.day_of_week)).size} Days
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {teacherAvailability.length} total scheduled slots
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-400 font-semibold uppercase">Verification Status</div>
            <div className={`text-base font-bold capitalize mt-2 flex items-center gap-1.5 ${
              isVerified ? 'text-emerald-700' : 'text-amber-600'
            }`}>
              <ShieldCheck className="w-5 h-5" />
              <span>{profile?.verification_status || 'Unverified'}</span>
            </div>
            {!isVerified && (
              <button
                onClick={() => onNavigate('verification')}
                className="text-[11px] font-semibold text-blue-600 hover:underline mt-1 block"
              >
                Submit credentials →
              </button>
            )}
          </div>
        </div>

        {/* Schedule preview & Recent Requests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Your Weekly Schedule Matrix</span>
              <button
                onClick={() => onNavigate('availability')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Modify schedule →
              </button>
            </div>
            <ScheduleViewer slots={teacherAvailability} compact />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-sm">Recent Parent Requests</span>
              <button
                onClick={() => onNavigate('requests')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                View all ({recentRequests.length}) →
              </button>
            </div>

            {recentRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400">
                No requests received yet. Ensure your subjects and schedule are up to date!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{req.student_name}</div>
                      <div className="text-slate-500 text-[11px]">
                        {req.subject} · {req.class_grade} · {req.preferred_time_slot}
                      </div>
                    </div>
                    <span className="capitalize font-semibold text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STUDENT / PARENT DASHBOARD
  // ==========================================
  if (user?.role === 'student') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
              Parent & Student Learning Hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged in as {user.full_name} · Track tutoring requests and search verified academic educators.
            </p>
          </div>

          <button
            onClick={() => onNavigate('teachers')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Find a Teacher</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Requests & Hired Tutors */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">My Active Tuition Requests ({recentRequests.length})</h3>
              <p className="text-xs text-slate-500">Track progress from request to accepted session and hiring.</p>
            </div>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Full Requests Tab →
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              You haven't sent any tuition requests yet. Explore teachers by subject, exact required slot, and location!
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={r.teacher_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={r.teacher_name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{r.teacher_name}</div>
                      <div className="text-slate-500">{r.subject} · {r.class_grade} · Slot: {r.preferred_time_slot}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="capitalize text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900">
                      {r.status}
                    </span>
                    <button
                      onClick={() => onNavigate('requests')}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SCHOOL / INSTITUTE DASHBOARD
  // ==========================================
  const totalApplicants = instituteJobs.reduce((acc, j) => acc + (j.applicant_count || 0), 0);
  const openVacancies = instituteJobs.filter((j) => j.status === 'open').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
            School & Academy Recruitment Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as {user?.full_name} · Manage faculty vacancies and candidate hiring pipeline.
          </p>
        </div>

        {onOpenPostJob && (
          <button
            onClick={onOpenPostJob}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Teaching Vacancy</span>
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Active Vacancies</div>
          <div className="text-2xl font-black text-slate-900 tabular-nums mt-1 font-['Outfit']">
            {openVacancies}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Open positions receiving applications</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Applicants</div>
          <div className="text-2xl font-black text-blue-600 tabular-nums mt-1 font-['Outfit']">
            {totalApplicants}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Candidates in recruitment funnel</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Interviews Conducted</div>
          <div className="text-2xl font-black text-amber-600 tabular-nums mt-1 font-['Outfit']">
            {instituteJobs.reduce((acc, j) => acc + (j.interview_count || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Demo lectures scheduled</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold uppercase">Faculty Hired</div>
          <div className="text-2xl font-black text-emerald-600 tabular-nums mt-1 font-['Outfit']">
            {instituteJobs.reduce((acc, j) => acc + (j.hired_count || 0), 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Completed recruitment matches</div>
        </div>
      </div>

      {/* Posted Vacancies List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Your Posted Positions</h3>
          <button
            onClick={() => onNavigate('applications')}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Candidate ATS Pipeline →
          </button>
        </div>

        <div className="space-y-3">
          {instituteJobs.map((j) => (
            <div
              key={j.id}
              className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 text-sm">{j.title}</div>
                <div className="text-slate-500">
                  {j.subject} · {j.class_grade} · {j.location} · {j.employment_type}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Compensation: ₹{j.salary_min?.toLocaleString()} - ₹{j.salary_max?.toLocaleString()} / {j.salary_type}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {j.applicant_count || 0} Candidates
                </span>
                <button
                  onClick={() => onNavigate('applications')}
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                >
                  Manage Candidates
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
