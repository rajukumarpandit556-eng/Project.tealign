/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/common/Header.tsx';
import { Footer } from './components/common/Footer.tsx';
import { DemoSwitcher } from './components/common/DemoSwitcher.tsx';
import { HomeView } from './components/home/HomeView.tsx';
import { FindTeachersView } from './components/teachers/FindTeachersView.tsx';
import { JobsView } from './components/jobs/JobsView.tsx';
import { AvailabilityScheduler } from './components/teachers/AvailabilityScheduler.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { RequestsView } from './components/requests/RequestsView.tsx';
import { ApplicationsView } from './components/applications/ApplicationsView.tsx';
import { VerificationView } from './components/teachers/VerificationView.tsx';
import { SavedView } from './components/saved/SavedView.tsx';
import { NotificationsView } from './components/notifications/NotificationsView.tsx';
import { HowItWorksView } from './components/info/HowItWorksView.tsx';
import { SafetyView } from './components/info/SafetyView.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';

// Modals
import { AuthModal } from './components/auth/AuthModal.tsx';
import { TeacherDetailModal } from './components/teachers/TeacherDetailModal.tsx';
import { RequestTeacherModal } from './components/requests/RequestTeacherModal.tsx';
import { PostJobModal } from './components/jobs/PostJobModal.tsx';
import { ReviewModal } from './components/reviews/ReviewModal.tsx';
import { MessageModal } from './components/chat/MessageModal.tsx';
import { Modal } from './components/common/Modal.tsx';

import { api } from './services/api.ts';

function MainApp() {
  const { user } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Modals State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacherData, setSelectedTeacherData] = useState<any | null>(null);

  const [requestTargetTeacher, setRequestTargetTeacher] = useState<any | null>(null);
  const [postJobOpen, setPostJobOpen] = useState<boolean>(false);

  // Review Modal State
  const [reviewTarget, setReviewTarget] = useState<{ teacherId: string; teacherName: string } | null>(null);

  // Message Modal State
  const [messageTarget, setMessageTarget] = useState<{
    contextType: 'request' | 'application';
    contextId: string;
    receiverId: string;
  } | null>(null);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState<{ targetType: string; targetId: string } | null>(null);
  const [reportReason, setReportReason] = useState<string>('Inappropriate behavior or misinformation');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);

  // Saved Items Tracking
  const [savedTeacherIds, setSavedTeacherIds] = useState<Set<string>>(new Set());

  // Load user saved teachers
  useEffect(() => {
    if (user) {
      api.getSavedItems()
        .then((res) => {
          setSavedTeacherIds(new Set((res.teachers || []).map((t: any) => t.id)));
        })
        .catch(() => {});
    } else {
      setSavedTeacherIds(new Set());
    }
  }, [user]);

  // Handle Teacher Select for Detailed Modal View
  const handleSelectTeacher = async (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    try {
      const res = await api.getTeacherById(teacherId);
      setSelectedTeacherData(res.teacher);
    } catch (err) {
      console.error('Failed to load teacher details:', err);
    }
  };

  // Toggle Save Teacher
  const handleToggleSave = async (teacherId: string) => {
    if (!user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    try {
      const res = await api.toggleSave('teacher', teacherId);
      const updated = new Set(savedTeacherIds);
      if (res.saved) {
        updated.add(teacherId);
      } else {
        updated.delete(teacherId);
      }
      setSavedTeacherIds(updated);
    } catch (err: any) {
      alert(err.message || 'Bookmark action failed');
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleRequestTeacher = (teacher: any) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setRequestTargetTeacher(teacher);
  };

  const handleOpenMessage = (contextType: 'request' | 'application', contextId: string, receiverId: string) => {
    setMessageTarget({ contextType, contextId, receiverId });
  };

  const handleOpenReview = (teacherId: string, teacherName: string) => {
    setReviewTarget({ teacherId, teacherName });
  };

  const handleOpenReport = (targetType: string, targetId: string) => {
    setReportTarget({ targetType, targetId });
    setReportDetails('');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;

    setReportSubmitting(true);
    try {
      await api.createReport({
        target_type: reportTarget.targetType,
        target_id: reportTarget.targetId,
        reason: reportReason,
        details: reportDetails,
      });
      alert('Report received. Our moderation team will investigate according to safety protocols.');
      setReportTarget(null);
    } catch (err: any) {
      alert(err.message || 'Report submission failed');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1-Click Interactive Role Playground Bar */}
      <DemoSwitcher onNavigate={setCurrentTab} />

      {/* Top Bar Header (3-Zone Contract) */}
      <Header
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onOpenPostJob={() => setPostJobOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {currentTab === 'home' && (
          <HomeView
            onNavigate={setCurrentTab}
            onOpenAuth={handleOpenAuth}
            onSelectTeacher={handleSelectTeacher}
          />
        )}

        {currentTab === 'teachers' && (
          <FindTeachersView
            onSelectTeacher={handleSelectTeacher}
            onRequestTeacher={handleRequestTeacher}
            onToggleSave={handleToggleSave}
            savedTeacherIds={savedTeacherIds}
          />
        )}

        {currentTab === 'jobs' && (
          <JobsView
            onOpenPostJob={() => setPostJobOpen(true)}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'availability' && <AvailabilityScheduler />}

        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentTab}
            onOpenPostJob={() => setPostJobOpen(true)}
          />
        )}

        {currentTab === 'requests' && (
          <RequestsView
            onOpenMessage={handleOpenMessage}
            onOpenReview={handleOpenReview}
          />
        )}

        {currentTab === 'applications' && (
          <ApplicationsView
            onOpenTeacherProfile={handleSelectTeacher}
            onOpenMessage={handleOpenMessage}
          />
        )}

        {currentTab === 'verification' && <VerificationView />}

        {currentTab === 'saved' && (
          <SavedView
            onSelectTeacher={handleSelectTeacher}
            onSelectJob={() => setCurrentTab('jobs')}
          />
        )}

        {currentTab === 'notifications' && (
          <NotificationsView onNavigate={setCurrentTab} />
        )}

        {currentTab === 'how-it-works' && (
          <HowItWorksView
            onNavigate={setCurrentTab}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === 'safety' && <SafetyView />}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Editorial Footer */}
      <Footer onNavigate={setCurrentTab} />

      {/* ----------------- MODALS ----------------- */}

      {/* Auth Modal (Login / Register / Quick Switch) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Teacher Profile & Full Schedule Modal */}
      {selectedTeacherData && (
        <TeacherDetailModal
          isOpen={!!selectedTeacherData}
          onClose={() => setSelectedTeacherData(null)}
          teacher={selectedTeacherData}
          onRequest={handleRequestTeacher}
          onToggleSave={handleToggleSave}
          onReport={handleOpenReport}
        />
      )}

      {/* Parent/Student Tuition Request Modal */}
      {requestTargetTeacher && (
        <RequestTeacherModal
          isOpen={!!requestTargetTeacher}
          onClose={() => setRequestTargetTeacher(null)}
          teacher={requestTargetTeacher}
          onSuccess={() => {
            alert('Tuition request sent successfully! You can track status in your Requests tab.');
            setCurrentTab('requests');
          }}
        />
      )}

      {/* Post Teaching Vacancy Modal (Institutes) */}
      <PostJobModal
        isOpen={postJobOpen}
        onClose={() => setPostJobOpen(false)}
        onSuccess={() => {
          alert('Teaching vacancy published to the marketplace!');
          setCurrentTab('jobs');
        }}
      />

      {/* Leave Review Modal */}
      {reviewTarget && (
        <ReviewModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          teacherId={reviewTarget.teacherId}
          teacherName={reviewTarget.teacherName}
          onSuccess={() => {
            alert('Your review was published!');
          }}
        />
      )}

      {/* In-App Direct Discussion Modal */}
      {messageTarget && (
        <MessageModal
          isOpen={!!messageTarget}
          onClose={() => setMessageTarget(null)}
          contextType={messageTarget.contextType}
          contextId={messageTarget.contextId}
          receiverId={messageTarget.receiverId}
          onReport={() => handleOpenReport('user', messageTarget.receiverId)}
        />
      )}

      {/* Safety & Policy Report Modal */}
      {reportTarget && (
        <Modal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          title="Submit Safety or Policy Report"
          subtitle="All reports are investigated by Tealign administration"
          maxWidth="md"
        >
          <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Report</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
              >
                <option value="Inappropriate behavior or language">Inappropriate behavior or language</option>
                <option value="False qualification or credentials">False qualification or credentials</option>
                <option value="Unsolicited payment or offline diversion">Unsolicited payment or offline diversion</option>
                <option value="Spam or fraudulent vacancy">Spam or fraudulent vacancy</option>
                <option value="Other policy concern">Other policy concern</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provide Additional Context</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                placeholder="Describe what occurred with dates or specific details..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 resize-none text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
