import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Send, Clock, MapPin, IndianRupee, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DayOfWeek, TeachingMode } from '../../types/index.ts';

interface RequestTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  onSuccess: () => void;
}

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export const RequestTeacherModal: React.FC<RequestTeacherModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSuccess,
}) => {
  const { user } = useAuth();
  const profile = teacher?.profile || teacher || {};

  const [subject, setSubject] = useState<string>(profile.subjects?.[0] || 'Mathematics');
  const [classGrade, setClassGrade] = useState<string>(profile.classes?.[0] || 'Grade 10');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('home_student');
  const [preferredDays, setPreferredDays] = useState<DayOfWeek[]>(['monday', 'wednesday', 'friday']);
  const [timeSlot, setTimeSlot] = useState<string>('17:00 - 18:30');
  const [studentLocation, setStudentLocation] = useState<string>(user?.location || 'New Delhi');
  const [hourlyBudget, setHourlyBudget] = useState<number>(profile.hourly_rate || 1000);
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!teacher) return null;

  const toggleDay = (day: DayOfWeek) => {
    if (preferredDays.includes(day)) {
      setPreferredDays(preferredDays.filter((d) => d !== day));
    } else {
      setPreferredDays([...preferredDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please describe your learning requirements or goals.');
      return;
    }
    if (preferredDays.length === 0) {
      setErrorMsg('Please select at least one preferred day of the week.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createRequest({
        teacher_id: teacher.user_id || teacher.id,
        subject,
        class_grade: classGrade,
        teaching_mode: teachingMode,
        preferred_days: preferredDays,
        preferred_time_slot: timeSlot,
        student_location: studentLocation,
        hourly_budget: hourlyBudget,
        message: message.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Tutoring Session"
      subtitle={`Send a direct request to ${teacher.full_name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Selected Teacher Summary */}
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={teacher.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={teacher.full_name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
            />
            <div>
              <div className="font-bold text-slate-900">{teacher.full_name}</div>
              <div className="text-slate-500 text-[11px]">{profile.qualification}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-extrabold text-blue-700 text-sm tabular-nums">
              ₹{profile.hourly_rate?.toLocaleString()}/hr
            </div>
            <div className="text-[10px] text-slate-500">Base hourly rate</div>
          </div>
        </div>

        {/* Subject & Grade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics, Physics"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class / Grade</label>
            <input
              type="text"
              value={classGrade}
              onChange={(e) => setClassGrade(e.target.value)}
              placeholder="e.g. Grade 10, JEE Prep"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
            />
          </div>
        </div>

        {/* Teaching Mode */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Teaching Mode</label>
          <select
            value={teachingMode}
            onChange={(e) => setTeachingMode(e.target.value as TeachingMode)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
          >
            <option value="home_student">Home Tuition (Teacher comes to student's residence)</option>
            <option value="teacher_home">Teacher's Home Studio</option>
            <option value="online">Live 1-on-1 Online Class</option>
            <option value="coaching">Coaching Academy Session</option>
          </select>
        </div>

        {/* Preferred Days */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Preferred Days</label>
          <div className="grid grid-cols-7 gap-1.5">
            {ALL_DAYS.map((d) => {
              const isSelected = preferredDays.includes(d.key);
              return (
                <button
                  type="button"
                  key={d.key}
                  onClick={() => toggleDay(d.key)}
                  className={`py-1.5 rounded-lg text-center font-semibold text-xs border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slot & Budget */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preferred Time Window</label>
            <input
              type="text"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder="e.g. 17:00 - 18:30"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hourly Budget Offer (₹)</label>
            <input
              type="number"
              value={hourlyBudget}
              onChange={(e) => setHourlyBudget(Number(e.target.value))}
              min={200}
              max={10000}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-mono text-xs"
            />
          </div>
        </div>

        {/* Student Location */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Location / Address Area</label>
          <input
            type="text"
            value={studentLocation}
            onChange={(e) => setStudentLocation(e.target.value)}
            placeholder="e.g. Greater Kailash, New Delhi"
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Requirements / Goals for the Teacher
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Explain student's current proficiency, upcoming exams, syllabus, or specific topics needing attention..."
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 resize-none"
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
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Sending Request...' : 'Send Tuition Request'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
