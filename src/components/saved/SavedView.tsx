import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Bookmark, Clock, ArrowRight, Trash2, Star, ShieldCheck, MapPin } from 'lucide-react';

interface SavedViewProps {
  onSelectTeacher: (teacherId: string) => void;
  onSelectJob: (job: any) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({ onSelectTeacher, onSelectJob }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'teachers' | 'jobs'>('teachers');

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const res = await api.getSavedItems();
      setTeachers(res.teachers || []);
      setJobs(res.jobs || []);
    } catch (err) {
      console.error('Failed to load saved items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemType: 'teacher' | 'job', itemId: string) => {
    try {
      await api.toggleSave(itemType, itemId);
      if (itemType === 'teacher') {
        setTeachers(teachers.filter((t) => t.id !== itemId));
      } else {
        setJobs(jobs.filter((j) => j.id !== itemId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600 fill-blue-600" />
            <span>Saved Teachers & Teaching Jobs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly return to bookmarked educators and school vacancies.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'teachers' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            Saved Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'jobs' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            Saved Jobs ({jobs.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <Clock className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Loading saved items...</span>
        </div>
      ) : activeTab === 'teachers' ? (
        teachers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-xs text-slate-400">
            No saved teachers yet. Click the bookmark icon on any teacher card to save them for later!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teachers.map((t) => (
              <div
                key={t.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={t.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={t.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{t.full_name}</span>
                      {t.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-slate-500 font-medium line-clamp-1">{t.title}</div>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current mr-0.5" />
                        <span className="text-slate-800">{Number(t.rating_avg || 5.0).toFixed(1)}</span>
                      </span>
                      <span>·</span>
                      <span className="font-bold text-slate-900">₹{t.hourly_rate}/hr</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <button
                    onClick={() => handleRemove('teacher', t.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectTeacher(t.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-xs text-slate-400">
          No saved teaching jobs yet. Click the bookmark icon on any job card to save it for later!
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="text-slate-500 text-[11px] font-semibold">{j.institute_name}</div>
                <div className="font-bold text-slate-900 text-sm">{j.title}</div>
                <div className="text-slate-500">
                  {j.subject} · {j.class_grade} · {j.location} · ₹{j.salary_min.toLocaleString()} - ₹{j.salary_max.toLocaleString()}/{j.salary_type}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemove('job', j.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectJob(j)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
