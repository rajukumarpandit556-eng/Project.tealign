import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { api } from '../../services/api.ts';
import { Plus, Trash2, AlertCircle, Building2 } from 'lucide-react';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [classGrade, setClassGrade] = useState('Grade 11-12');
  const [qualificationReq, setQualificationReq] = useState('Master Degree in relevant subject, B.Ed preferred');
  const [experienceReq, setExperienceReq] = useState(3);
  const [location, setLocation] = useState('Campus Center, New Delhi');
  const [employmentType, setEmploymentType] = useState<'full-time' | 'part-time' | 'hourly'>('full-time');
  const [salaryMin, setSalaryMin] = useState(60000);
  const [salaryMax, setSalaryMax] = useState(85000);
  const [salaryType, setSalaryType] = useState<'monthly' | 'hourly'>('monthly');
  const [scheduleItems, setScheduleItems] = useState<Array<{ day: string; time: string }>>([
    { day: 'Monday - Friday', time: '08:30 - 14:30' },
  ]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addScheduleItem = () => {
    setScheduleItems([...scheduleItems, { day: 'Saturday', time: '09:00 - 13:00' }]);
  };

  const updateScheduleItem = (index: number, field: 'day' | 'time', value: string) => {
    const updated = [...scheduleItems];
    updated[index][field] = value;
    setScheduleItems(updated);
  };

  const removeScheduleItem = (index: number) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Job title and job description are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createJob({
        title: title.trim(),
        subject: subject.trim(),
        class_grade: classGrade.trim(),
        qualification_req: qualificationReq.trim(),
        experience_req: experienceReq,
        location: location.trim(),
        employment_type: employmentType,
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_type: salaryType,
        required_schedule: scheduleItems,
        description: description.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to post vacancy.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Post Teaching Vacancy"
      subtitle="Publish an open teaching position for verified educators"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Secondary Mathematics Faculty (CBSE / JEE)"
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
          />
        </div>

        {/* Subject & Grade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics, Chemistry, English"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Classes / Cohort</label>
            <input
              type="text"
              value={classGrade}
              onChange={(e) => setClassGrade(e.target.value)}
              placeholder="e.g. Grade 9-10, IIT-JEE Foundation"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>
        </div>

        {/* Employment Type & Experience */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
            >
              <option value="full-time">Full-Time Faculty</option>
              <option value="part-time">Part-Time Instructor</option>
              <option value="hourly">Hourly Visiting Mentor</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Min Experience (Years)</label>
            <input
              type="number"
              value={experienceReq}
              onChange={(e) => setExperienceReq(Number(e.target.value))}
              min={0}
              max={30}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-mono"
            />
          </div>
        </div>

        {/* Salary Range */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Salary Min (₹)</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
              min={500}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Salary Max (₹)</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(Number(e.target.value))}
              min={salaryMin}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pay Period</label>
            <select
              value={salaryType}
              onChange={(e) => setSalaryType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
            >
              <option value="monthly">Per Month</option>
              <option value="hourly">Per Hour</option>
            </select>
          </div>
        </div>

        {/* Qualification & Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Qualification Criteria</label>
            <input
              type="text"
              value={qualificationReq}
              onChange={(e) => setQualificationReq(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location / Campus</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
            />
          </div>
        </div>

        {/* Required Teaching Schedule */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-semibold text-slate-700">Required Teaching Schedule</label>
            <button
              type="button"
              onClick={addScheduleItem}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-3 h-3" />
              <span>Add Schedule Slot</span>
            </button>
          </div>

          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {scheduleItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.day}
                  onChange={(e) => updateScheduleItem(idx, 'day', e.target.value)}
                  placeholder="e.g. Mon, Wed, Fri"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={item.time}
                  onChange={(e) => updateScheduleItem(idx, 'time', e.target.value)}
                  placeholder="e.g. 08:30 - 14:00"
                  className="w-36 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
                {scheduleItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScheduleItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Job Description & Responsibilities</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Outline daily duties, batch sizes, diagnostic assessments, faculty collaboration, and benefits..."
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 resize-none leading-relaxed"
          />
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
            <Building2 className="w-3.5 h-3.5" />
            <span>{submitting ? 'Publishing...' : 'Publish Job Opening'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
