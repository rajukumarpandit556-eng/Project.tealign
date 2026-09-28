import React from 'react';
import { Job } from '../../types/index.ts';
import { Building2, MapPin, Clock, IndianRupee, Users, Bookmark, ArrowRight, Check } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onSelect: (job: Job) => void;
  onApply: (job: Job) => void;
  onToggleSave: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelect, onApply, onToggleSave }) => {
  const isClosed = job.status === 'closed';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group">
      <div>
        {/* Header: Institute Logo, Title, Save */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <img
              src={job.institute_logo || '/src/assets/images/institute_campus_building_1790609515143.jpg'}
              alt={job.institute_name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                <span>{job.institute_name}</span>
                <span className="capitalize px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600">
                  {job.institute_type}
                </span>
              </div>

              <button
                onClick={() => onSelect(job)}
                className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors text-left line-clamp-1 mt-0.5"
              >
                {job.title}
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <span>{job.subject}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{job.class_grade}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="capitalize">{job.employment_type}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onToggleSave(job.id)}
            className={`p-2 rounded-lg transition-colors ${
              job.is_saved
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={job.is_saved ? 'Remove bookmark' : 'Bookmark job'}
          >
            <Bookmark className={`w-4 h-4 ${job.is_saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Location & Experience */}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{job.experience_req}+ yrs exp required</span>
        </div>

        {/* Schedule snippet */}
        {job.required_schedule && job.required_schedule.length > 0 && (
          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Required Teaching Schedule:</span>
            </div>
            {job.required_schedule.slice(0, 2).map((s, idx) => (
              <div key={idx} className="flex justify-between pl-4 text-slate-600">
                <span>{s.day}</span>
                <span className="font-mono text-slate-800 font-medium">{s.time}</span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Footer: Compensation & Apply CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Compensation</div>
          <div className="text-base font-extrabold text-slate-900 tabular-nums font-['Outfit']">
            ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-0.5">/{job.salary_type === 'hourly' ? 'hr' : 'mo'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {job.user_applied ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>{job.user_application_status ? job.user_application_status.toUpperCase() : 'APPLIED'}</span>
            </span>
          ) : isClosed ? (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
              Closed
            </span>
          ) : (
            <>
              <button
                onClick={() => onSelect(job)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Details
              </button>
              <button
                onClick={() => onApply(job)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
              >
                <span>Apply</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
