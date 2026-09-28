import React, { useState, useEffect } from 'react';
import { Job } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { JobCard } from './JobCard.tsx';
import { ApplyModal } from './ApplyModal.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  PlusCircle,
  Building2,
  CalendarCheck,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface JobsViewProps {
  onOpenPostJob?: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ onOpenPostJob, onOpenAuth }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  // Filters
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  // Selected Job for Details Modal & Apply Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyJobTarget, setApplyJobTarget] = useState<Job | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({
        q,
        subject,
        class_grade: classGrade,
        location,
        employment_type: employmentType,
      });
      setJobs(res.jobs || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [subject, classGrade, employmentType]);

  const handleToggleSave = async (jobId: string) => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    try {
      const res = await api.toggleSave('job', jobId);
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, is_saved: res.saved } : j)));
    } catch (err: any) {
      alert(err.message || 'Failed to bookmark');
    }
  };

  const handleApplyClick = (job: Job) => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (user.role !== 'teacher') {
      alert('Only registered educators can submit job applications. Please sign in or switch to a Teacher account.');
      return;
    }
    setApplyJobTarget(job);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-100 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>K-12 Schools & Coaching Academy Recruitment</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
            Teaching Positions & Faculty Openings
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Connect directly with school principals and coaching academy directors for full-time, part-time, and visiting mentorship positions.
          </p>
        </div>

        {user?.role === 'institute' && onOpenPostJob && (
          <button
            onClick={onOpenPostJob}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a Vacancy</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search job title, subject, school..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-blue-600 font-medium"
            />
          </div>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Computer Science">Computer Science</option>
            <option value="English">English</option>
          </select>

          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
          >
            <option value="">Any Commitment</option>
            <option value="full-time">Full-Time Faculty</option>
            <option value="part-time">Part-Time</option>
            <option value="hourly">Hourly Visiting</option>
          </select>

          <button
            onClick={fetchJobs}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-2xs"
          >
            Filter
          </button>
        </div>

        <div className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900 tabular-nums">{total}</span> opening{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <Clock className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Loading teaching vacancies...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No open positions matching criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your subject or commitment filters to see all available vacancies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelect={setSelectedJob}
              onApply={handleApplyClick}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          subtitle={`${selectedJob.institute_name} · ${selectedJob.location}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedJob.institute_logo || '/src/assets/images/institute_campus_building_1790609515143.jpg'}
                  alt={selectedJob.institute_name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedJob.institute_name}</div>
                  <div className="text-slate-500 text-[11px] capitalize">{selectedJob.institute_type} · {selectedJob.location}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-slate-900 tabular-nums font-['Outfit']">
                  ₹{selectedJob.salary_min.toLocaleString()} - ₹{selectedJob.salary_max.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">per {selectedJob.salary_type}</div>
              </div>
            </div>

            {/* Quick badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Subject</span>
                <span className="font-bold text-slate-800">{selectedJob.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Class / Grade</span>
                <span className="font-bold text-slate-800">{selectedJob.class_grade}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Commitment</span>
                <span className="font-bold text-slate-800 capitalize">{selectedJob.employment_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Min Experience</span>
                <span className="font-bold text-slate-800">{selectedJob.experience_req}+ Years</span>
              </div>
            </div>

            {/* Required Schedule */}
            {selectedJob.required_schedule && selectedJob.required_schedule.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Required Teaching Schedule</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                  {selectedJob.required_schedule.map((s, idx) => (
                    <div key={idx} className="flex justify-between text-blue-950 font-medium">
                      <span>{s.day}</span>
                      <span className="font-mono">{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qualifications */}
            <div>
              <div className="font-bold text-slate-800 mb-1">Desired Qualifications</div>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedJob.qualification_req}
              </p>
            </div>

            {/* Description */}
            <div>
              <div className="font-bold text-slate-800 mb-1">Job Description & Responsibilities</div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {selectedJob.description}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  handleApplyClick(selectedJob);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Apply for Position
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Apply Modal */}
      {applyJobTarget && (
        <ApplyModal
          isOpen={!!applyJobTarget}
          onClose={() => setApplyJobTarget(null)}
          job={applyJobTarget}
          onSuccess={() => {
            alert('Your application was submitted successfully!');
            fetchJobs();
          }}
        />
      )}
    </div>
  );
};
