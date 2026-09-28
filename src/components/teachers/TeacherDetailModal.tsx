import React from 'react';
import { Modal } from '../common/Modal.tsx';
import { ScheduleViewer } from '../common/ScheduleViewer.tsx';
import {
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Bookmark,
  Award,
  BookOpen,
  Globe,
  Briefcase,
  Send,
  Flag,
  CalendarCheck
} from 'lucide-react';

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  onRequest: (teacher: any) => void;
  onToggleSave: (teacherId: string) => void;
  onReport: (targetType: string, targetId: string) => void;
}

const MODE_LABELS: Record<string, string> = {
  home_student: "Student's Residence",
  teacher_home: "Teacher's Home Studio",
  coaching: 'Coaching Institute',
  school: 'K-12 School Staffing',
  online: 'Live 1-on-1 Online',
};

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onRequest,
  onToggleSave,
  onReport,
}) => {
  if (!teacher) return null;

  const profile = teacher.profile || teacher;
  const isVerified = teacher.is_verified === 1 || profile.verification_status === 'verified';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={teacher.full_name}
      subtitle={profile.qualification || 'Educator Profile'}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Profile Hero Header */}
        <div className="flex flex-col sm:flex-row items-start gap-5 pb-6 border-b border-slate-100">
          <div className="relative shrink-0">
            <img
              src={teacher.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={teacher.full_name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
            />
            {isVerified && (
              <div
                className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full ring-2 ring-white"
                title="Verified Educator"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                {teacher.full_name}
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleSave(teacher.user_id || teacher.id)}
                  className={`p-2 rounded-lg border transition-colors ${
                    teacher.is_saved
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Bookmark teacher"
                >
                  <Bookmark className={`w-4 h-4 ${teacher.is_saved ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => onReport('user', teacher.user_id || teacher.id)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Report profile"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {profile.title}
            </p>

            {/* Unboxed Metadata Line */}
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <div className="flex items-center text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-current mr-1" />
                <span className="text-slate-900 tabular-nums">{Number(profile.rating_avg || 5.0).toFixed(1)}</span>
              </div>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>{profile.review_count || 0} reviews</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>{profile.experience_years} years experience</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {teacher.location} ({profile.service_radius_km || 10} km)
              </span>
            </div>

            {/* Fees Highlight */}
            <div className="pt-1 flex items-baseline gap-4">
              <div>
                <span className="text-xs text-slate-400">Hourly Rate: </span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums">
                  ₹{profile.hourly_rate?.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500">/hr</span>
                </span>
              </div>
              {profile.monthly_rate && (
                <div>
                  <span className="text-xs text-slate-400">Monthly Cohort: </span>
                  <span className="text-sm font-bold text-slate-800 tabular-nums">
                    ₹{profile.monthly_rate?.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              About & Pedagogical Philosophy
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Grid: Qualifications, Subjects, Grades, Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Qualification & Background</span>
            </div>
            <div className="text-xs text-slate-600 pl-5">
              {profile.qualification}
            </div>
            {profile.verification_notes && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 mt-2">
                ✓ {profile.verification_notes}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Subjects & Grades</span>
            </div>
            <div className="text-xs text-slate-700 font-medium pl-5 space-y-1">
              <div>Subjects: {(profile.subjects || []).join(', ')}</div>
              <div>Classes: {(profile.classes || []).join(', ')}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Accepted Teaching Modes</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-5">
              {(profile.teaching_modes || []).map((m: string) => (
                <span key={m} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {MODE_LABELS[m] || m}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>Medium of Instruction</span>
            </div>
            <div className="text-xs text-slate-700 pl-5">
              {(profile.languages || []).join(', ') || 'English'}
            </div>
          </div>
        </div>

        {/* Weekly Availability Schedule */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            Weekly Availability Schedule
          </h4>
          <ScheduleViewer slots={teacher.availability || []} />
        </div>

        {/* Reviews Section */}
        {teacher.reviews && teacher.reviews.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Verified Student & Parent Reviews ({teacher.reviews.length})
            </h4>
            <div className="space-y-3">
              {teacher.reviews.map((r: any) => (
                <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">{r.reviewer_name}</span>
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-current mr-0.5" />
                      <span>{r.rating} / 5</span>
                    </div>
                  </div>
                  <div className="text-slate-500 text-[11px] mb-1">
                    Subject: {r.subject} · Verified tuition interaction
                  </div>
                  <p className="text-slate-700 italic">"{r.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onRequest(teacher);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Request Teacher</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
