import React, { useState, useEffect } from 'react';
import { JobApplication, Job, ApplicationStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../common/Modal.tsx';

interface ApplicationsViewProps {
  onOpenTeacherProfile?: (teacherId: string) => void;
  onOpenMessage?: (contextType: 'application', contextId: string, receiverId: string) => void;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string }> = {
  applied: { label: 'Application Submitted', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800' },
  shortlisted: { label: 'Shortlisted Candidate', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
  interview: { label: 'Interview Scheduled', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
  hired: { label: 'Hired Faculty', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
  rejected: { label: 'Not Selected', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  onOpenTeacherProfile,
  onOpenMessage,
}) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  // Teacher State
  const [teacherApps, setTeacherApps] = useState<JobApplication[]>([]);

  // Institute State
  const [instituteJobs, setInstituteJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);

  // Interview Schedule Modal State
  const [interviewModalOpen, setInterviewModalOpen] = useState<boolean>(false);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [interviewNotes, setInterviewNotes] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [user?.role]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const res = await api.getMyApplications();
        setTeacherApps(res.applications);
      } else {
        const res = await api.getMyInstituteJobs();
        setInstituteJobs(res.jobs);
        if (res.jobs.length > 0 && !selectedJobId) {
          selectJob(res.jobs[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    try {
      const res = await api.getJobApplications(jobId);
      setJobApplications(res.applications);
      setSelectedJobTitle(res.job_title);
    } catch (err) {
      console.error('Failed to load job applications:', err);
    }
  };

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus, date?: string, notes?: string) => {
    setUpdatingStatus(true);
    try {
      await api.updateApplicationStatus(appId, {
        status,
        interview_date: date,
        interview_notes: notes,
      });

      if (selectedJobId) {
        await selectJob(selectedJobId);
      }
      setInterviewModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openInterviewScheduler = (appId: string) => {
    setActiveAppId(appId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setInterviewDate(tomorrow.toISOString().split('T')[0] + ' 15:00');
    setInterviewNotes('Round 1: 30-minute conceptual demo lecture followed by Q&A with Academic Coordinator.');
    setInterviewModalOpen(true);
  };

  // ==========================================
  // TEACHER VIEW
  // ==========================================
  if (isTeacher) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
            My Job Applications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time hiring progress, interview invitations, and status updates for applications submitted to schools and coaching academies.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Clock className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            <span>Loading applications...</span>
          </div>
        ) : teacherApps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No applications submitted yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Browse open teaching positions from reputable schools and coaching institutes to apply.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teacherApps.map((app) => {
              const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={app.institute_logo || '/src/assets/images/institute_campus_building_1790609515143.jpg'}
                        alt={app.institute_name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs text-slate-500 font-semibold">{app.institute_name}</div>
                        <div className="font-bold text-slate-900 text-base">{app.job_title}</div>
                        <div className="text-xs text-slate-500">
                          {app.subject} · {app.class_grade} · {app.job_location}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Interview details if scheduled */}
                  {app.status === 'interview' && (
                    <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1.5">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                        <Calendar className="w-4 h-4 text-amber-700" />
                        <span>Interview Scheduled</span>
                      </div>
                      <div className="font-mono text-amber-950 font-semibold">
                        Timing: {app.interview_date}
                      </div>
                      {app.interview_notes && (
                        <div className="text-amber-900">
                          <span className="font-semibold">Instructions: </span>
                          {app.interview_notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cover letter summary */}
                  {app.cover_letter && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                      "{app.cover_letter}"
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div>
                      Expected Salary: <span className="font-bold text-slate-800 tabular-nums">₹{app.expected_salary?.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Applied on {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // INSTITUTE VIEW (APPLICANT MANAGEMENT)
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
          Institute Applicant Tracking System
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review candidates for your school's vacancies, evaluate qualifications, schedule demo interviews, and extend hiring offers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Posted Jobs selector */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Your Posted Openings ({instituteJobs.length})
          </div>

          {instituteJobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            return (
              <button
                key={job.id}
                onClick={() => selectJob(job.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 line-clamp-1">{job.title}</div>
                <div className="text-slate-500 mt-0.5">{job.subject} · {job.class_grade}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-blue-700">
                    {job.applicant_count || 0} candidate{job.applicant_count !== 1 ? 's' : ''}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    job.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column: Candidates List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Candidates for: <span className="text-blue-600 normal-case">{selectedJobTitle || 'Select a job'}</span>
            </div>
            <div className="text-xs text-slate-500">
              {jobApplications.length} Applicant{jobApplications.length !== 1 ? 's' : ''}
            </div>
          </div>

          {jobApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No applicants yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                When teachers apply for this job, their full credentials, experience, and schedules will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobApplications.map((cand) => {
                const status = STATUS_CONFIG[cand.status] || STATUS_CONFIG.applied;

                return (
                  <div
                    key={cand.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        <img
                          src={cand.teacher_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={cand.teacher_name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{cand.teacher_name}</span>
                            {cand.is_verified && (
                              <span className="inline-flex items-center text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">{cand.qualification}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-current mr-0.5" />
                              <span className="text-slate-800">{Number(cand.rating_avg || 5.0).toFixed(1)}</span>
                            </span>
                            <span>·</span>
                            <span>{cand.experience_years} yrs exp</span>
                            <span>·</span>
                            <span>{cand.teacher_location}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Candidate Cover Letter */}
                    {cand.cover_letter && (
                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic">
                        "{cand.cover_letter}"
                      </div>
                    )}

                    {/* Interview status indicator if scheduled */}
                    {cand.status === 'interview' && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                        <div className="font-bold">Interview Scheduled: {cand.interview_date}</div>
                        {cand.interview_notes && <div className="text-[11px] mt-0.5">{cand.interview_notes}</div>}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-500">
                        Expected: <span className="font-bold text-slate-900 tabular-nums">₹{cand.expected_salary?.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenTeacherProfile && (
                          <button
                            onClick={() => onOpenTeacherProfile(cand.teacher_id)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            View Profile
                          </button>
                        )}

                        {cand.status === 'applied' && (
                          <button
                            onClick={() => handleUpdateStatus(cand.id, 'shortlisted')}
                            disabled={updatingStatus}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          >
                            Shortlist
                          </button>
                        )}

                        {cand.status !== 'interview' && cand.status !== 'hired' && (
                          <button
                            onClick={() => openInterviewScheduler(cand.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                          >
                            Schedule Interview
                          </button>
                        )}

                        {cand.status !== 'hired' && (
                          <button
                            onClick={() => handleUpdateStatus(cand.id, 'hired')}
                            disabled={updatingStatus}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                          >
                            Hire Candidate
                          </button>
                        )}

                        {cand.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(cand.id, 'rejected')}
                            disabled={updatingStatus}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        title="Schedule Candidate Interview"
        subtitle="Specify interview date, time, format, and preparation guidelines"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Interview Date & Time</label>
            <input
              type="text"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              placeholder="e.g. 2026-10-04 15:00"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Demo Lecture / Screening Notes</label>
            <textarea
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              rows={3}
              placeholder="Demo topic requirements, meeting link, panel details..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={() => setInterviewModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => activeAppId && handleUpdateStatus(activeAppId, 'interview', interviewDate, interviewNotes)}
              disabled={updatingStatus}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
            >
              Confirm Interview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
