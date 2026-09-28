import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Job } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Briefcase, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onSuccess: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ isOpen, onClose, job, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [expectedSalary, setExpectedSalary] = useState<number>(job?.salary_min || 60000);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      setErrorMsg('Please include a brief cover letter highlighting your teaching philosophy and subject mastery.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.applyJob(job.id, {
        cover_letter: coverLetter.trim(),
        expected_salary: expectedSalary,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Application failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Teaching Position"
      subtitle={`${job.title} at ${job.institute_name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Job Quick Info */}
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900">{job.title}</div>
            <div className="text-slate-500 text-[11px]">
              {job.subject} · {job.class_grade} · {job.location}
            </div>
          </div>
          <div className="text-right">
            <div className="font-extrabold text-blue-700 text-sm tabular-nums">
              ₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">Offered {job.salary_type} range</div>
          </div>
        </div>

        {/* Expected Compensation */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Your Expected Compensation (₹ / {job.salary_type === 'hourly' ? 'hour' : 'month'})
          </label>
          <input
            type="number"
            value={expectedSalary}
            onChange={(e) => setExpectedSalary(Number(e.target.value))}
            min={100}
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-mono text-xs"
          />
        </div>

        {/* Cover Letter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Statement of Purpose & Pedagogy
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={4}
            placeholder="Introduce yourself, your academic credentials, past student results, and how your approach fits the institution's requirements..."
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 resize-none leading-relaxed"
          />
        </div>

        {/* Profile Attachment Notice */}
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-[11px]">
          Your Tealign educator profile, verified credentials, and availability schedule will be attached automatically to this application.
        </div>

        {/* Footer CTAs */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
