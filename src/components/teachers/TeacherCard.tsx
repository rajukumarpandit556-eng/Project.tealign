import React from 'react';
import { Star, ShieldCheck, MapPin, Clock, Bookmark, ArrowRight } from 'lucide-react';
import { TeachingMode } from '../../types/index.ts';

interface TeacherCardProps {
  teacher: any;
  onSelect: (teacherId: string) => void;
  onRequest: (teacher: any) => void;
  onToggleSave: (teacherId: string) => void;
  isSaved?: boolean;
}

const MODE_LABELS: Record<string, string> = {
  home_student: "Student's Home",
  teacher_home: "Teacher's Home",
  coaching: 'Coaching Center',
  school: 'School Staffing',
  online: 'Live 1-on-1 Online',
};

export const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  onSelect,
  onRequest,
  onToggleSave,
  isSaved = false,
}) => {
  const isVerified = teacher.is_verified === 1 || teacher.verification_status === 'verified';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group">
      <div>
        {/* Header zone: Avatar, Name, Rating, Save */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <img
                src={teacher.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={teacher.full_name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-xl object-cover border border-slate-100 shadow-2xs group-hover:scale-102 transition-transform"
              />
              {isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full ring-2 ring-white"
                  title="Tealign Verified Educator"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => onSelect(teacher.user_id || teacher.id)}
                  className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors text-left"
                >
                  {teacher.full_name}
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                {teacher.qualification || 'Educator'}
              </div>

              {/* Unboxed metadata row with typographic separators */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                  <span className="tabular-nums text-slate-900">{Number(teacher.rating_avg || 5.0).toFixed(1)}</span>
                </div>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{teacher.review_count || 0} reviews</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{teacher.experience_years} yrs exp</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onToggleSave(teacher.user_id || teacher.id)}
            className={`p-2 rounded-lg transition-colors ${
              isSaved
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save teacher'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bio / Title */}
        <p className="text-xs text-slate-600 line-clamp-2 mt-3 leading-relaxed">
          {teacher.title || teacher.bio || 'Dedicated educator offering personalized coaching and conceptual clarity.'}
        </p>

        {/* Subjects & Modes */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          {/* Subjects (unboxed text style) */}
          <div className="text-xs text-slate-700 font-medium flex items-center gap-1 flex-wrap">
            <span className="text-slate-400 font-normal">Subjects:</span>
            {(teacher.subjects || []).slice(0, 3).map((subj: string, idx: number) => (
              <span key={subj} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                {subj}{idx < Math.min((teacher.subjects || []).length, 3) - 1 ? '' : ''}
              </span>
            ))}
            {(teacher.subjects || []).length > 3 && (
              <span className="text-slate-400 text-[11px]">
                +{teacher.subjects.length - 3} more
              </span>
            )}
          </div>

          {/* Location & Service Radius */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{teacher.location || 'Online / Pan-City'}</span>
            {teacher.service_radius_km && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{teacher.service_radius_km} km radius</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Fee & CTAs */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Tutoring Fee</div>
          <div className="text-base font-extrabold text-slate-900 tabular-nums font-['Outfit']">
            ₹{teacher.hourly_rate?.toLocaleString() || 800}
            <span className="text-xs font-normal text-slate-500 ml-0.5">/hr</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(teacher.user_id || teacher.id)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => onRequest(teacher)}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            <span>Request</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
