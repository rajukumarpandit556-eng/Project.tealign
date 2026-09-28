import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { User, Report, Review } from '../../types/index.ts';
import {
  ShieldCheck,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Slash,
  MessageSquare,
  TrendingUp,
  Activity,
  CalendarCheck
} from 'lucide-react';
import { Modal } from '../common/Modal.tsx';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verifications' | 'moderation'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Verification Review Action Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedVerifyTeacher, setSelectedVerifyTeacher] = useState<any>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, verifRes, modRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminVerifications(),
        api.getAdminModeration(),
      ]);

      setStats(statsRes);
      setUsers(usersRes.users);
      setVerifications(verifRes.verifications);
      setReports(modRes.reports);
      setReviews(modRes.reviews);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean | number | undefined) => {
    try {
      const willSuspend = !currentStatus;
      await api.toggleUserSuspension(userId, willSuspend);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_suspended: willSuspend ? 1 : 0 } : u)));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleApproveVerification = async (userId: string) => {
    setActionLoading(true);
    try {
      await api.updateVerificationStatus(userId, 'verified', verifyNotes || 'All university degrees and ID credentials approved.');
      setVerifyModalOpen(false);
      setVerifyNotes('');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVerification = async (userId: string) => {
    setActionLoading(true);
    try {
      await api.updateVerificationStatus(userId, 'rejected', verifyNotes || 'Insufficient or unverified certificates. Please submit official university transcripts.');
      setVerifyModalOpen(false);
      setVerifyNotes('');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      await api.resolveReport(reportId, {
        status,
        action_taken: 'Admin reviewed and addressed this report according to platform standards.',
      });
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: status as any } : r)));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleToggleReviewModeration = async (reviewId: string, currentMod: number) => {
    try {
      const willModerate = currentMod === 1 ? false : true;
      await api.toggleReviewModeration(reviewId, willModerate);
      setReviews(reviews.map((r) => (r.id === reviewId ? { ...r, is_moderated: willModerate ? 1 : 0 } : r)));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesSearch = !userSearch ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Admin Title Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight font-['Outfit']">
              Tealign Platform Administration
            </span>
            <span className="text-[11px] font-semibold bg-blue-600/60 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/40">
              Root Level
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time governance, teacher credential verification, user management, and marketplace safety.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'overview', label: 'Platform Analytics' },
            { id: 'users', label: 'User Directory' },
            { id: 'verifications', label: `Verifications (${stats?.metrics?.pending_verifications || 0})` },
            { id: 'moderation', label: `Reports & Trust (${stats?.metrics?.pending_reports || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Users</div>
              <div className="text-2xl font-black text-slate-900 tabular-nums mt-1 font-['Outfit']">
                {stats?.metrics?.total_users || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats?.metrics?.teachers || 0} Teachers · {stats?.metrics?.students || 0} Students · {stats?.metrics?.institutes || 0} Schools
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Open Teaching Jobs</div>
              <div className="text-2xl font-black text-blue-600 tabular-nums mt-1 font-['Outfit']">
                {stats?.metrics?.open_jobs || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats?.metrics?.total_applications || 0} Total Applications Received
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Pending Verifications</div>
              <div className="text-2xl font-black text-amber-600 tabular-nums mt-1 font-['Outfit']">
                {stats?.metrics?.pending_verifications || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Awaiting manual credential review
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Tuition Requests</div>
              <div className="text-2xl font-black text-emerald-600 tabular-nums mt-1 font-['Outfit']">
                {stats?.metrics?.total_requests || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Parent-Teacher connections generated
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Recent User Registrations
                </span>
                <span className="text-xs text-slate-400">Live</span>
              </div>
              <div className="space-y-3">
                {(stats?.recent_users || []).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between text-xs py-1">
                    <div>
                      <div className="font-bold text-slate-800">{u.full_name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="capitalize text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {u.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Recent Tuition Inquiries
                </span>
                <span className="text-xs text-slate-400">Marketplace Flow</span>
              </div>
              <div className="space-y-3">
                {(stats?.recent_requests || []).map((r: any) => (
                  <div key={r.id} className="text-xs py-1 border-b border-slate-50 last:border-0">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{r.student_name} → {r.teacher_name}</span>
                      <span className="capitalize text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {r.status}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {r.subject} ({r.class_grade}) · Budget: ₹{r.hourly_budget}/hr
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="">All Roles</option>
                <option value="teacher">Teachers</option>
                <option value="student">Parents / Students</option>
                <option value="institute">Schools / Institutes</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSuspended = u.is_suspended === 1;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={u.full_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{u.full_name}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                        {u.role}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 truncate max-w-[150px]">
                        {u.location || 'Online'}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_verified ? (
                          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-100">
                            Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unverified</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-100">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleSuspension(u.id, isSuspended)}
                            className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            {isSuspended ? 'Reactivate' : 'Suspend User'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER VERIFICATIONS QUEUE */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Teacher Credential Verification Queue</h3>
              <p className="text-xs text-slate-500">Inspect academic certificates and approve verified educator status.</p>
            </div>
            <div className="text-xs font-semibold text-slate-600">
              {verifications.length} Submissions Total
            </div>
          </div>

          <div className="space-y-4">
            {verifications.map((v) => {
              const isPending = v.verification_status === 'pending';
              const isVerified = v.verification_status === 'verified';

              return (
                <div
                  key={v.user_id}
                  className={`p-5 rounded-2xl border transition-all text-xs ${
                    isPending
                      ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={v.full_name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{v.full_name}</div>
                        <div className="text-slate-500">{v.email} · {v.phone}</div>
                        <div className="text-slate-700 font-medium mt-0.5">{v.qualification} ({v.experience_years} yrs exp)</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        Status: {v.verification_status}
                      </span>
                    </div>
                  </div>

                  {/* Submission details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 bg-white p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Submitted Document</span>
                      <span className="font-mono text-blue-700 font-semibold">{v.verification_doc_name || 'degree_certificate.pdf'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Teacher Statement / License ID</span>
                      <span className="text-slate-700">{v.verification_notes || 'Pending initial review'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedVerifyTeacher(v);
                        setVerifyNotes(v.verification_notes || '');
                        setVerifyModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs transition-colors"
                    >
                      Review & Decide
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MODERATION & REPORTS */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Reports */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Safety & Policy Reports ({reports.length})</span>
            </h3>

            {reports.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">No reports recorded.</div>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900">{rep.reason}</div>
                        <div className="text-[11px] text-slate-500">Reported by: {rep.reporter_name}</div>
                      </div>
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800">
                        {rep.status}
                      </span>
                    </div>

                    {rep.details && (
                      <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                        "{rep.details}"
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      {rep.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'resolved')}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-semibold text-[11px]"
                          >
                            Resolve Report
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'dismissed')}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-[11px]"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Moderation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Review Content Moderation ({reviews.length})</span>
            </h3>

            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800">{rev.reviewer_name} → {rev.teacher_name}</span>
                    <span className="text-amber-500 font-bold">{rev.rating} ★</span>
                  </div>
                  <p className="text-slate-600 italic">"{rev.comment}"</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[10px] font-semibold ${rev.is_moderated ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {rev.is_moderated ? 'Approved & Visible' : 'Hidden from public'}
                    </span>
                    <button
                      onClick={() => handleToggleReviewModeration(rev.id, rev.is_moderated)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      {rev.is_moderated ? 'Hide Review' : 'Approve Review'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verification Review Modal */}
      {selectedVerifyTeacher && (
        <Modal
          isOpen={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          title={`Review Credentials: ${selectedVerifyTeacher.full_name}`}
          subtitle="Audit submitted degrees and update verified educator badge"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{selectedVerifyTeacher.qualification}</div>
              <div className="text-slate-500">Document: {selectedVerifyTeacher.verification_doc_name || 'transcripts.pdf'}</div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Admin Evaluation Notes
              </label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                rows={3}
                placeholder="State verified qualifications or reasons for rejection..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 resize-none text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectVerification(selectedVerifyTeacher.user_id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveVerification(selectedVerifyTeacher.user_id)}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Approve & Grant Verified Badge
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
