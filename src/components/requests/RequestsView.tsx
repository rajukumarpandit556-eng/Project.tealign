import React, { useState, useEffect } from 'react';
import { TeacherRequest, RequestStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Star,
  MapPin,
  Calendar,
  AlertCircle,
  Briefcase
} from 'lucide-react';

interface RequestsViewProps {
  onOpenMessage: (contextType: 'request', contextId: string, receiverId: string) => void;
  onOpenReview?: (teacherId: string, teacherName: string) => void;
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending Response', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
  accepted: { label: 'Accepted by Teacher', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
  declined: { label: 'Declined', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  hired: { label: 'Hiring Active', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
  completed: { label: 'Tuition Completed', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-500' },
};

export const RequestsView: React.FC<RequestsViewProps> = ({ onOpenMessage, onOpenReview }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isTeacher = user?.role === 'teacher';

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const res = await api.getTeacherRequests();
        setRequests(res.requests);
      } else {
        const res = await api.getStudentRequests();
        setRequests(res.requests);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user?.role]);

  const handleUpdateStatus = async (requestId: string, newStatus: RequestStatus, notes?: string) => {
    setActionLoading(requestId);
    try {
      await api.updateRequestStatus(requestId, { status: newStatus, status_notes: notes });
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
            {isTeacher ? 'Incoming Parent & Student Requests' : 'My Tuition Requests'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? 'Review inquiries from students and parents, accept sessions, and manage tuition connections.'
              : 'Track status of your sent requests, start direct messages, and confirm tutor hiring.'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold">
          {['all', 'pending', 'accepted', 'hired', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors whitespace-nowrap ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <Clock className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Loading tuition requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isTeacher
              ? 'You have no tuition inquiries matching this filter. Keep your availability updated to receive more matches.'
              : 'You have not submitted any tuition requests yet. Explore verified educators to connect!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const otherPartyId = isTeacher ? req.student_id : req.teacher_id;
            const otherPartyName = isTeacher ? req.student_name : req.teacher_name;
            const otherPartyAvatar = isTeacher ? req.student_avatar : req.teacher_avatar;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 transition-all hover:border-slate-300"
              >
                {/* Header row: Other party, subject, status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={otherPartyAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={otherPartyName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{otherPartyName}</span>
                        {req.teacher_verified && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">
                            Verified Tutor
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {req.subject} · {req.class_grade} · Mode: {req.teaching_mode}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Details grid: Time window, Days, Budget, Location */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Schedule Window</span>
                    <span className="font-bold text-slate-800">{req.preferred_time_slot}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Days Requested</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {(req.preferred_days || []).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hourly Budget</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      ₹{req.hourly_budget || 1000}/hr
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {req.student_location}
                    </span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 italic">
                  "{req.message}"
                </div>

                {/* Status Notes if any */}
                {req.status_notes && (
                  <div className="text-xs text-slate-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                    <span className="font-semibold text-blue-900">Status Update:</span> {req.status_notes}
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-400">
                    Requested on {new Date(req.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Chat button */}
                    <button
                      onClick={() => onOpenMessage('request', req.id, otherPartyId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Chat Discussion</span>
                    </button>

                    {/* Teacher Actions */}
                    {isTeacher && req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'accepted', 'Teacher accepted the tuition request.')}
                          disabled={actionLoading === req.id}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Request</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'declined', 'Teacher schedule has conflicting hours.')}
                          disabled={actionLoading === req.id}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold text-xs transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {isTeacher && req.status === 'hired' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'completed', 'Tuition curriculum completed successfully.')}
                        disabled={actionLoading === req.id}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
                      >
                        Mark Tuition Completed
                      </button>
                    )}

                    {/* Student Actions */}
                    {!isTeacher && req.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'hired', 'Parent confirmed tutor hiring.')}
                        disabled={actionLoading === req.id}
                        className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Hire Teacher</span>
                      </button>
                    )}

                    {!isTeacher && (req.status === 'hired' || req.status === 'completed') && onOpenReview && (
                      <button
                        onClick={() => onOpenReview(req.teacher_id, req.teacher_name || 'Teacher')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-lg font-semibold text-xs transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Leave Review</span>
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
  );
};
